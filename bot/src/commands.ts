import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Organize your server into personal and work sections")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("task")
    .setDescription("Manage your private work, personal, and preparation tasks")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a task")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Work, personal, or preparation")
            .setRequired(true)
            .addChoices(
              { name: "Work", value: "work" },
              { name: "Personal", value: "personal" },
              { name: "Preparation", value: "preparation" },
            ),
        )
        .addStringOption((option) =>
          option.setName("title").setDescription("What do you need to do?").setRequired(true).setMaxLength(200),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List your open tasks")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Filter by category")
            .addChoices(
              { name: "Work", value: "work" },
              { name: "Personal", value: "personal" },
              { name: "Preparation", value: "preparation" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("done")
        .setDescription("Mark a task as done")
        .addIntegerOption((option) => option.setName("id").setDescription("Task ID from /task list").setRequired(true).setMinValue(1)),
    ),
  new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Manage private reminders delivered by DM")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Set a reminder")
        .addIntegerOption((option) =>
          option.setName("minutes").setDescription("How many minutes from now (1–43200)").setRequired(true).setMinValue(1).setMaxValue(43200),
        )
        .addStringOption((option) =>
          option.setName("message").setDescription("What should I remind you about?").setRequired(true).setMaxLength(200),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List your pending reminders")),
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open or close a private support ticket")
    .addSubcommand((subcommand) => subcommand.setName("open").setDescription("Open a private ticket"))
    .addSubcommand((subcommand) => subcommand.setName("close").setDescription("Close this ticket")),
  new SlashCommandBuilder()
    .setName("portfolio")
    .setDescription("Show the portfolio link"),
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show private workspace and work/personal/preparation task stats"),
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post an announcement in the configured channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("message").setDescription("Announcement text").setRequired(true).setMaxLength(1800),
    ),
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Temporarily timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName("member").setDescription("Member to timeout").setRequired(true))
    .addIntegerOption((option) =>
      option.setName("minutes").setDescription("Timeout length (1–10080 minutes)").setRequired(true).setMinValue(1).setMaxValue(10080),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why is this member being timed out?").setMaxLength(400),
    ),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete recent messages from this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option.setName("count").setDescription("Number of messages to delete (1–100)").setRequired(true).setMinValue(1).setMaxValue(100),
    ),
  new SlashCommandBuilder()
    .setName("music")
    .setDescription("Play music from YouTube or SoundCloud links")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("play")
        .setDescription("Play or queue a track")
        .addStringOption((option) =>
          option.setName("url").setDescription("A YouTube or SoundCloud track URL").setRequired(true).setMaxLength(500),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("pause").setDescription("Pause playback"))
    .addSubcommand((subcommand) => subcommand.setName("resume").setDescription("Resume playback"))
    .addSubcommand((subcommand) => subcommand.setName("skip").setDescription("Skip the current track"))
    .addSubcommand((subcommand) => subcommand.setName("stop").setDescription("Stop and clear the queue"))
    .addSubcommand((subcommand) => subcommand.setName("queue").setDescription("Show the current queue")),
];
