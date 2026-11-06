import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error("Set DISCORD_TOKEN and CLIENT_ID in bot/.env before registering commands.");
}

const rest = new REST({ version: "10" }).setToken(token);
const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(clientId, process.env.GUILD_ID)
  : Routes.applicationCommands(clientId);

await rest.put(route, { body: commands.map((command) => command.toJSON()) });
console.log(`Registered ${commands.length} slash commands${process.env.GUILD_ID ? " for the test server" : " globally"}.`);
