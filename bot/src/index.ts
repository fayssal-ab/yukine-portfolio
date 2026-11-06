import "dotenv/config";
import {
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type Interaction,
} from "discord.js";
import { SoundCloudExtractor } from "@discord-player/extractor";
import { Player } from "discord-player";
import { YoutubeExtractor } from "discord-player-youtubei";
import { closeDatabase, db, execute, initializeDatabase, rows } from "./database.js";
import type { RowDataPacket } from "mysql2/promise";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Set DISCORD_TOKEN in bot/.env.");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
});
const player = new Player(client);

interface Settings extends RowDataPacket {
  welcome_channel_id: string;
  announcement_channel_id: string;
  ticket_category_id: string;
}

interface TaskRow extends RowDataPacket {
  id: number;
  category: "work" | "personal";
  title: string;
}

interface ReminderRow extends RowDataPacket {
  id: number;
  user_id: string;
  message: string;
  due_at: Date;
}

interface TicketRow extends RowDataPacket {
  channel_id: string;
  owner_user_id: string;
  status: "open" | "closed";
}

interface CountRow extends RowDataPacket {
  category: "work" | "personal";
  count: number;
}

function safeTrackTitle(title: string) {
  return title.replace(/[\r\n]/g, " ").slice(0, 120);
}

async function settingsFor(guildId: string) {
  const found = await rows<Settings>(
    "SELECT welcome_channel_id, announcement_channel_id, ticket_category_id FROM guild_settings WHERE guild_id = ?",
    [guildId],
  );
  return found[0];
}

function isGuildInteraction(
  interaction: ChatInputCommandInteraction,
): interaction is ChatInputCommandInteraction & { guild: Guild } {
  return interaction.inGuild() && interaction.guild !== null;
}

async function ensureCategory(guild: Guild, name: string) {
  const found = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name === name,
  );
  return found ?? guild.channels.create({ name, type: ChannelType.GuildCategory });
}

async function ensureTextChannel(guild: Guild, name: string, parentId: string) {
  const found = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildText && channel.name === name,
  );
  if (found) return found;
  return guild.channels.create({ name, type: ChannelType.GuildText, parent: parentId });
}

async function setupServer(guild: Guild) {
  const info = await ensureCategory(guild, "START HERE");
  const community = await ensureCategory(guild, "COMMUNITY");
  const support = await ensureCategory(guild, "SUPPORT");

  const welcome = await ensureTextChannel(guild, "welcome", info.id);
  const announcements = await ensureTextChannel(guild, "announcements", info.id);
  await ensureTextChannel(guild, "rules", info.id);
  await ensureTextChannel(guild, "general", community.id);
  await ensureTextChannel(guild, "work", community.id);
  await ensureTextChannel(guild, "portfolio", community.id);

  await execute(
    `INSERT INTO guild_settings (guild_id, welcome_channel_id, announcement_channel_id, ticket_category_id)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       welcome_channel_id = VALUES(welcome_channel_id),
       announcement_channel_id = VALUES(announcement_channel_id),
       ticket_category_id = VALUES(ticket_category_id)`,
    [guild.id, welcome.id, announcements.id, support.id],
  );
}

async function handleTask(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "add") {
    const categoryValue = interaction.options.getString("category", true);
    const category = categoryValue === "work" ? "work" : "personal";
    const title = interaction.options.getString("title", true);
    const result = await execute(
      "INSERT INTO tasks (guild_id, user_id, category, title, created_at) VALUES (?, ?, ?, ?, ?)",
      [interaction.guildId!, interaction.user.id, category, title, new Date()],
    );
    await interaction.reply({
      content: `Added **${category}** task #${result.insertId}: ${title}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (subcommand === "list") {
    const category = interaction.options.getString("category");
    const tasks = await rows<TaskRow>(
      `SELECT id, category, title FROM tasks
       WHERE guild_id = ? AND user_id = ? AND done_at IS NULL AND (? IS NULL OR category = ?)
       ORDER BY created_at ASC LIMIT 8`,
      [interaction.guildId!, interaction.user.id, category, category],
    );
    const content = tasks.length
      ? tasks.map((task) => `\`#${task.id}\` **${task.category}** — ${task.title}`).join("\n")
      : "No open tasks. Add one with `/task add`.";
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    return;
  }

  const id = interaction.options.getInteger("id", true);
  const result = await execute(
    "UPDATE tasks SET done_at = ? WHERE id = ? AND guild_id = ? AND user_id = ? AND done_at IS NULL",
    [new Date(), id, interaction.guildId!, interaction.user.id],
  );
  await interaction.reply({
    content: result.affectedRows
      ? `Task #${id} completed.`
      : `I couldn't find an open task #${id} that belongs to you.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleReminder(interaction: ChatInputCommandInteraction) {
  if (interaction.options.getSubcommand() === "add") {
    const minutes = interaction.options.getInteger("minutes", true);
    const message = interaction.options.getString("message", true);
    const dueAt = new Date(Date.now() + minutes * 60_000);
    const result = await execute(
      "INSERT INTO reminders (guild_id, user_id, message, due_at) VALUES (?, ?, ?, ?)",
      [interaction.guildId!, interaction.user.id, message, dueAt],
    );
    await interaction.reply({
      content: `Reminder #${result.insertId} set for <t:${Math.floor(dueAt.getTime() / 1000)}:F>. I'll send it to your DMs.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const reminders = await rows<ReminderRow>(
    `SELECT id, message, due_at FROM reminders
     WHERE guild_id = ? AND user_id = ? AND status = 'pending'
     ORDER BY due_at ASC LIMIT 8`,
    [interaction.guildId!, interaction.user.id],
  );
  const content = reminders.length
    ? reminders
        .map((reminder) => `\`#${reminder.id}\` <t:${Math.floor(reminder.due_at.getTime() / 1000)}:R> — ${reminder.message}`)
        .join("\n")
    : "You have no pending reminders.";
  await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}

async function handleTicket(interaction: ChatInputCommandInteraction & { guild: Guild }) {
  const guild = interaction.guild;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (interaction.options.getSubcommand() === "open") {
    const activeTickets = await rows<TicketRow>(
      "SELECT channel_id, owner_user_id, status FROM tickets WHERE guild_id = ? AND owner_user_id = ? AND status = 'open' LIMIT 1",
      [guild.id, interaction.user.id],
    );
    const active = activeTickets[0];
    if (active) {
      const channel = await guild.channels.fetch(active.channel_id).catch((error: unknown) => {
        console.error("Could not fetch the user's open ticket:", error);
        return null;
      });
      if (channel) {
        await interaction.editReply({
          content: `You already have an open ticket: ${channel}`,
        });
        return;
      }
      await execute("UPDATE tickets SET status = 'closed' WHERE channel_id = ?", [active.channel_id]);
    }

    const settings = await settingsFor(guild.id);
    if (!settings) {
      await interaction.editReply({
        content: "An admin needs to run `/setup` before tickets can be opened.",
      });
      return;
    }

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ];
    const staffRoleId = process.env.STAFF_ROLE_ID;
    if (staffRoleId && guild.roles.cache.has(staffRoleId)) {
      overwrites.push({
        id: staffRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

    const channel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 90),
      type: ChannelType.GuildText,
      parent: settings.ticket_category_id,
      permissionOverwrites: overwrites,
    });
    try {
      await execute(
        "INSERT INTO tickets (channel_id, guild_id, owner_user_id, created_at) VALUES (?, ?, ?, ?)",
        [channel.id, guild.id, interaction.user.id, new Date()],
      );
      await channel.send(
        `${interaction.user} opened a ticket. Please describe what you need; a moderator can close it with \`/ticket close\`.`,
      );
    } catch (error) {
      await channel.delete("Ticket setup failed").catch((cleanupError: unknown) => {
        console.error("Could not remove an incomplete ticket channel:", cleanupError);
      });
      throw error;
    }
    await interaction.editReply({ content: `Your private ticket is ready: ${channel}` });
    return;
  }

  const foundTickets = await rows<TicketRow>(
    "SELECT channel_id, owner_user_id, status FROM tickets WHERE channel_id = ? AND guild_id = ?",
    [interaction.channelId, guild.id],
  );
  const ticket = foundTickets[0];
  const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ?? false;
  if (!ticket || ticket.status !== "open") {
    await interaction.editReply({ content: "This channel isn't an open bot ticket." });
    return;
  }
  if (ticket.owner_user_id !== interaction.user.id && !canManage) {
    await interaction.editReply({ content: "Only the ticket owner or a moderator can close this ticket." });
    return;
  }
  await execute("UPDATE tickets SET status = 'closed' WHERE channel_id = ?", [interaction.channelId]);
  await interaction.editReply({ content: "Ticket closed. This channel will be deleted in 5 seconds." });
  setTimeout(() => {
    void interaction.channel
      ?.delete("Ticket closed")
      .catch((error: unknown) => console.error("Could not delete closed ticket:", error));
  }, 5_000);
}

async function handleMusic(interaction: ChatInputCommandInteraction & { guild: Guild }) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "play") {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({ content: "Join a voice channel first.", flags: MessageFlags.Ephemeral });
      return;
    }
    const botMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
    const permissions = voiceChannel.permissionsFor(botMember);
    if (!permissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
      await interaction.reply({
        content: "I need permission to connect and speak in your voice channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const input = interaction.options.getString("url", true);
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      await interaction.reply({
        content: "Enter a valid YouTube or SoundCloud URL.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      url.protocol !== "https:" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      !["youtube.com", "m.youtube.com", "youtu.be", "soundcloud.com", "m.soundcloud.com"].includes(host)
    ) {
      await interaction.reply({
        content: "Only HTTPS YouTube and SoundCloud links are supported.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { track } = await player.play(voiceChannel, url.toString(), {
      nodeOptions: { metadata: { channelId: interaction.channelId } },
    });
    await interaction.editReply({
      content: `Queued **${safeTrackTitle(track.cleanTitle)}**.`,
      allowedMentions: { parse: [] },
    });
    return;
  }

  const queue = player.nodes.get(interaction.guild.id);
  if (subcommand === "queue") {
    const tracks = queue?.tracks.toArray() ?? [];
    const current = queue?.currentTrack;
    const lines = [
      current ? `**Now playing:** ${safeTrackTitle(current.cleanTitle)}` : "",
      ...tracks.slice(0, 8).map((track, index) => `\`${index + 1}.\` ${safeTrackTitle(track.cleanTitle)}`),
    ].filter(Boolean);
    await interaction.reply({
      content: lines.length ? lines.join("\n") : "Nothing is playing and the queue is empty.",
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
    return;
  }
  if (!queue) {
    await interaction.reply({
      content: "There isn't an active music queue.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (subcommand === "pause") {
    queue.node.pause();
    await interaction.reply({ content: "Playback paused.", flags: MessageFlags.Ephemeral });
  } else if (subcommand === "resume") {
    queue.node.resume();
    await interaction.reply({ content: "Playback resumed.", flags: MessageFlags.Ephemeral });
  } else if (subcommand === "skip") {
    queue.node.skip();
    await interaction.reply({ content: "Skipped the current track.", flags: MessageFlags.Ephemeral });
  } else {
    await queue.delete();
    await interaction.reply({ content: "Playback stopped and queue cleared.", flags: MessageFlags.Ephemeral });
  }
}

async function handleStats(interaction: ChatInputCommandInteraction & { guild: Guild }) {
  const taskStats = await rows<CountRow>(
    `SELECT category, COUNT(*) AS count FROM tasks
     WHERE guild_id = ? AND user_id = ? AND done_at IS NULL
     GROUP BY category`,
    [interaction.guild.id, interaction.user.id],
  );
  const work = Number(taskStats.find((row) => row.category === "work")?.count ?? 0);
  const personal = Number(taskStats.find((row) => row.category === "personal")?.count ?? 0);
  const total = work + personal;
  const workPercent = total ? Math.round((work / total) * 100) : 0;
  const personalPercent = total ? 100 - workPercent : 0;

  const fields = [
    { name: "Server members", value: String(interaction.guild.memberCount), inline: true },
    {
      name: "Your open tasks",
      value: total
        ? `Work: ${work} (${workPercent}%)\nPersonal: ${personal} (${personalPercent}%)`
        : "None yet. Add one with `/task add`.",
      inline: true,
    },
  ];
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
    const tickets = await rows<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM tickets WHERE guild_id = ? AND status = 'open'",
      [interaction.guild.id],
    );
    fields.push({
      name: "Open support tickets",
      value: String(Number(tickets[0]?.count ?? 0)),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x45bcf4)
    .setTitle("Server & task stats")
    .setDescription("Work/personal percentages are based on your open task count, not tracked time.")
    .addFields(fields);
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleInteraction(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "portfolio") {
      const rawUrl = process.env.PORTFOLIO_URL;
      if (!rawUrl) {
        await interaction.reply({
          content: "The portfolio link hasn't been configured yet. Ask an admin to set PORTFOLIO_URL.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      let portfolioUrl: URL;
      try {
        portfolioUrl = new URL(rawUrl);
      } catch {
        throw new Error("PORTFOLIO_URL must be a valid HTTPS URL.");
      }
      if (portfolioUrl.protocol !== "https:") {
        throw new Error("PORTFOLIO_URL must use HTTPS.");
      }
      const embed = new EmbedBuilder()
        .setColor(0xc642f3)
        .setTitle("YUKINE — Portfolio")
        .setDescription("Websites, stores, Discord bots and integrations, built around your brand.")
        .setURL(portfolioUrl.toString());
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "setup") {
      if (!isGuildInteraction(interaction)) {
        await interaction.reply({
          content: "Run this command inside your server.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await setupServer(interaction.guild);
      await interaction.editReply(
        "Server layout is ready. Missing channels were created, and welcome, announcement, and ticket settings were saved.",
      );
      return;
    }

    if (!isGuildInteraction(interaction)) {
      await interaction.reply({
        content: "This command must be used inside a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    switch (interaction.commandName) {
      case "task":
        await handleTask(interaction);
        break;
      case "remind":
        await handleReminder(interaction);
        break;
      case "ticket":
        await handleTicket(interaction);
        break;
      case "music":
        await handleMusic(interaction);
        break;
      case "stats":
        await handleStats(interaction);
        break;
      case "announce": {
        const settings = await settingsFor(interaction.guild.id);
        const channel = settings
          ? await interaction.guild.channels.fetch(settings.announcement_channel_id)
          : null;
        if (!channel || !channel.isTextBased() || !("send" in channel)) {
          await interaction.reply({
            content: "Run `/setup` first so I know where to post announcements.",
            flags: MessageFlags.Ephemeral,
          });
          break;
        }
        await channel.send({
          content: interaction.options.getString("message", true),
          allowedMentions: { parse: [] },
        });
        await interaction.reply({
          content: `Announcement posted in ${channel}.`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
      case "timeout": {
        const user = interaction.options.getUser("member", true);
        const target = await interaction.guild.members.fetch(user.id);
        const minutes = interaction.options.getInteger("minutes", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";
        if (!target.moderatable) {
          await interaction.reply({
            content: "I can't timeout that member. Check role hierarchy and my Moderate Members permission.",
            flags: MessageFlags.Ephemeral,
          });
          break;
        }
        await target.timeout(minutes * 60_000, `${reason} (by ${interaction.user.tag})`);
        await interaction.reply({
          content: `Timed out ${target.user.tag} for ${minutes} minute(s).`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
      case "clear": {
        const channel = interaction.channel;
        const count = interaction.options.getInteger("count", true);
        if (!channel || !channel.isTextBased() || !("bulkDelete" in channel)) {
          await interaction.reply({
            content: "This command only works in a text channel.",
            flags: MessageFlags.Ephemeral,
          });
          break;
        }
        const deleted = await channel.bulkDelete(count, true);
        await interaction.reply({
          content: `Deleted ${deleted.size} recent message(s).`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
      default:
        await interaction.reply({ content: "Unknown command.", flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error(`Command failed (${interaction.commandName}):`, error);
    const message = "That command failed. Check the bot logs and its server permissions, then try again.";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral }).catch((replyError: unknown) => {
        console.error("Could not report command failure to the user:", replyError);
      });
    } else {
      await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch((replyError: unknown) => {
        console.error("Could not report command failure to the user:", replyError);
      });
    }
  }
}

let reminderRunInProgress = false;
async function deliverDueReminders() {
  if (reminderRunInProgress) return;
  reminderRunInProgress = true;
  try {
    const due = await rows<ReminderRow>(
      `SELECT id, user_id, message, due_at FROM reminders
       WHERE status = 'pending' AND due_at <= UTC_TIMESTAMP(3)
       ORDER BY due_at LIMIT 50`,
    );
    for (const reminder of due) {
      try {
        const user = await client.users.fetch(reminder.user_id);
        await user.send(`⏰ Reminder: ${reminder.message}`);
        await execute("UPDATE reminders SET status = 'sent' WHERE id = ? AND status = 'pending'", [reminder.id]);
      } catch (error) {
        await execute("UPDATE reminders SET status = 'failed' WHERE id = ? AND status = 'pending'", [reminder.id]);
        console.error(`Could not deliver reminder #${reminder.id} to user ${reminder.user_id}:`, error);
      }
    }
  } finally {
    reminderRunInProgress = false;
  }
}

client.on("guildMemberAdd", async (member: GuildMember) => {
  try {
    const settings = await settingsFor(member.guild.id);
    if (!settings) return;
    const channel = await member.guild.channels.fetch(settings.welcome_channel_id);
    if (channel?.isTextBased() && "send" in channel) {
      await channel.send({
        content: `Welcome ${member} to **${member.guild.name}**! Please check #rules and introduce yourself.`,
      });
    }
  } catch (error) {
    console.error("Could not send the welcome message:", error);
  }
});

client.on("interactionCreate", (interaction) => {
  void handleInteraction(interaction);
});

player.events.on("playerStart", (queue, track) => {
  const channelId = (queue.metadata as { channelId?: string } | undefined)?.channelId;
  if (!channelId) return;
  void (async () => {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel?.isTextBased() && "send" in channel) {
        await channel.send({
          content: `Now playing **${safeTrackTitle(track.cleanTitle)}**.`,
          allowedMentions: { parse: [] },
        });
      }
    } catch (error) {
      console.error("Could not announce the current music track:", error);
    }
  })();
});

player.events.on("error", (_queue, error) => console.error("Music player error:", error));
player.events.on("playerError", (_queue, error) => console.error("Track playback error:", error));

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}.`);
  const timer = setInterval(() => {
    void deliverDueReminders().catch((error: unknown) => console.error("Reminder check failed:", error));
  }, 15_000);
  timer.unref();
  void deliverDueReminders().catch((error: unknown) => console.error("Initial reminder check failed:", error));
});

async function shutdown() {
  client.destroy();
  await closeDatabase();
  process.exitCode = 0;
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await initializeDatabase();
await player.extractors.register(SoundCloudExtractor, {});
await player.extractors.register(YoutubeExtractor, {});
await client.login(token);
