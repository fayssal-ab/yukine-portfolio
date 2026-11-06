# YUKINE Discord bot

This is a separate, always-on Discord bot service. It does not run inside the portfolio's Netlify deployment.

## Features

- `/setup` organizes the server into two private sections: `👤 PERSONAL` first and `💼 WORK` below it. It adds emoji-labeled channels with descriptions and a welcome guide, while preserving existing messages. The break-time channel is for Discord Activities; this bot does not include casino/economy commands. Categories are visible only to the server owner and bot.
- `/setup` also creates `🗓️・study-plan` with a pinned G1 class timetable and revision plan for the estimated November controls and January 1 exams. The pinned plan remains available while the bot is offline.
- `🎶・music-guide` explains music commands and their online requirement; the guide remains available while the bot is offline.
- `/task` stores private work, personal, and preparation task lists for each member.
- `/remind` sends private reminders by DM; reminders survive restarts in MySQL.
- `/ticket` can still create an optional private ticket manually; the fixed `inbox` channel is the normal place for personal requests, so messages do not create extra tickets.
- `/portfolio` shares the configured portfolio link.
- `/announce`, `/timeout`, and `/clear` provide basic moderator tools.
- `/music` plays YouTube and SoundCloud URLs with a queue, pause, resume, skip, and stop.

Tasks, reminders, tickets, and server settings are stored in MySQL. On normal startup, the bot creates its own tables (`guild_settings`, `tasks`, `reminders`, and `tickets`) and leaves every other table alone. The website is unchanged and does not connect to this database in this version.

## Requirements

- Node.js 22 or newer
- FFmpeg installed on the host and available on `PATH`
- `mysqldump` 8.0 or newer for the optional reset-and-backup command
- The bot's YouTube/SoundCloud extractors are installed with the bot dependencies.
- A Discord application and bot created in the [Discord Developer Portal](https://discord.com/developers/applications)
- The bot needs the `bot` and `applications.commands` OAuth scopes. Grant only the permissions it needs: View Channels, Send Messages, Read Message History, Manage Channels, Manage Messages, Moderate Members, Connect, and Speak.
- The bot does not request privileged gateway intents. Welcome-on-join events are not enabled; slash commands, reminders, and music work without them.

## Run locally

```bash
cd bot
npm install
cp .env.example .env
```

Fill in `DISCORD_TOKEN`, `CLIENT_ID`, `PORTFOLIO_URL`, and the MySQL connection values in `bot/.env`. Do not commit `.env` or share secrets in chat. For Aiven, use its host, port, database name, user, password, and download the CA certificate to a local file; set `DB_SSL_CA_PATH` to that file. TLS certificate verification stays enabled. Set `GUILD_ID` while testing so slash commands update quickly; remove it to register globally after testing.

```bash
npm run build
npm run register
npm run dev
```

For production, run `npm run build`, `npm run register`, and `npm start` on an always-on worker/VPS. You can set `STAFF_ROLE_ID` to a server role that should see support tickets.

Run `/setup` from the account that owns the server. It organizes personal channels above work channels, and makes both sections private to the owner and bot. This does not prevent someone from joining through an invite; do not share invite links. New members are not kicked automatically.

Use `/task add` and choose Work, Personal, or Preparation; `/task list` displays open tasks and `/task done` marks them complete. Reminders use `/remind`; delivery at the due time requires the bot to be online. The `music-room` is a private voice channel; join it and use `/music play` with a supported HTTPS link.

## Optional database reset (destructive)

The bot does not wipe existing databases when it starts. To replace the existing contents of `DB_NAME`, set `RESET_EXPECTED_DB` to the exact same database name, make sure the Aiven CA certificate path is configured, then run:

```bash
npm run build
npm run db:reset
```

The reset tool asks you to type the exact database name, writes a restricted-permission SQL backup under `bot/backups/`, verifies the backup is non-empty, then drops every table and view and creates the bot's empty tables. Do not run this against a database whose existing data you still need. Keep the backup somewhere safe before removing it.

Music playback depends on the selected extractor/provider and FFmpeg. Only YouTube and SoundCloud HTTPS links are accepted; use links to audio you are allowed to play and follow the provider's terms.
