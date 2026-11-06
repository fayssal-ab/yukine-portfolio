# YUKINE Discord bot

This is a separate, always-on Discord bot service. It does not run inside the portfolio's Netlify deployment.

## Features

- `/setup` creates missing `START HERE`, `COMMUNITY`, and `SUPPORT` categories and their channels. Existing channels with those names are reused.
- `/task` stores private work and personal task lists for each member.
- `/remind` sends private reminders by DM; reminders survive restarts in MySQL.
- `/ticket` creates private support channels and lets the owner or a moderator close them.
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
- Enable the **Server Members Intent** in the Developer Portal for welcome messages. Slash commands and music do not need Message Content Intent.

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

## Optional database reset (destructive)

The bot does not wipe existing databases when it starts. To replace the existing contents of `DB_NAME`, set `RESET_EXPECTED_DB` to the exact same database name, make sure the Aiven CA certificate path is configured, then run:

```bash
npm run build
npm run db:reset
```

The reset tool asks you to type the exact database name, writes a restricted-permission SQL backup under `bot/backups/`, verifies the backup is non-empty, then drops every table and view and creates the bot's empty tables. Do not run this against a database whose existing data you still need. Keep the backup somewhere safe before removing it.

Music playback depends on the selected extractor/provider and FFmpeg. Only YouTube and SoundCloud HTTPS links are accepted; use links to audio you are allowed to play and follow the provider's terms.
