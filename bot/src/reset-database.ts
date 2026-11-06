import "dotenv/config";
import { chmodSync, closeSync, mkdirSync, openSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { escapeId } from "mysql2";
import type { RowDataPacket } from "mysql2/promise";
import { closeDatabase, db, initializeDatabase, rows } from "./database.js";

interface DatabaseObject extends RowDataPacket {
  TABLE_NAME: string;
  TABLE_TYPE: "BASE TABLE" | "VIEW";
}

function optionValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;
}

async function createBackup(configPath: string, backupPath: string, databaseName: string) {
  const file = openSync(backupPath, "wx", 0o600);
  closeSync(file);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(
      "mysqldump",
      [
        `--defaults-extra-file=${configPath}`,
        "--single-transaction",
        "--routines",
        "--triggers",
        "--events",
        "--hex-blob",
        "--set-gtid-purged=OFF",
        "--no-tablespaces",
        `--result-file=${backupPath}`,
        "--databases",
        databaseName,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr = (stderr + chunk).slice(-8000);
    });
    child.once("error", rejectPromise);
    child.once("close", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`mysqldump failed (${code ?? "unknown exit"}): ${stderr.trim()}`));
    });
  });

  if (statSync(backupPath).size === 0) {
    throw new Error("The backup file is empty; refusing to clear the database.");
  }
}

const databaseName = process.env.DB_NAME;
if (!databaseName) throw new Error("Set DB_NAME in bot/.env.");
if (process.env.RESET_EXPECTED_DB !== databaseName) {
  throw new Error("RESET_EXPECTED_DB must exactly match DB_NAME before the reset can run.");
}
if (!process.env.DB_SSL_CA_PATH) {
  throw new Error("Set DB_SSL_CA_PATH to the Aiven CA certificate before backing up or resetting.");
}

const botRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backupDirectory = resolve(botRoot, "backups");
mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
chmodSync(backupDirectory, 0o700);
const suffix = new Date().toISOString().replace(/[:.]/g, "-");
const safeDatabaseName = databaseName.replace(/[^a-zA-Z0-9_-]/g, "_");
const backupPath = resolve(backupDirectory, `${safeDatabaseName}-${suffix}.sql`);
const configPath = resolve(backupDirectory, `.mysql-${process.pid}-${suffix}.cnf`);

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const port = process.env.DB_PORT || "3306";
const caPath = process.env.DB_SSL_CA_PATH;
if (!host || !user || !password || !caPath) {
  throw new Error("Set DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, and DB_SSL_CA_PATH in bot/.env.");
}

writeFileSync(
  configPath,
  [
    "[client]",
    `host=${optionValue(host)}`,
    `port=${optionValue(port)}`,
    `user=${optionValue(user)}`,
    `password=${optionValue(password)}`,
    "ssl-mode=VERIFY_IDENTITY",
    `ssl-ca=${optionValue(resolve(caPath))}`,
    "",
  ].join("\n"),
  { mode: 0o600, flag: "wx" },
);

const readline = createInterface({ input: stdin, output: stdout });
try {
  const answer = await readline.question(
    `This will back up ${databaseName} to ${backupPath}, then DROP every table and view in that database and create empty bot tables. Type "${databaseName}" to continue: `,
  );
  if (answer !== databaseName) {
    throw new Error("Database reset cancelled; no tables were changed.");
  }

  await createBackup(configPath, backupPath, databaseName);
  console.log(`Backup created (${statSync(backupPath).size} bytes).`);

  const objects = await rows<DatabaseObject>(
    "SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.tables WHERE TABLE_SCHEMA = ?",
    [databaseName],
  );
  const connection = await db.getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const object of objects.filter((item) => item.TABLE_TYPE === "VIEW")) {
      await connection.query(`DROP VIEW IF EXISTS ${escapeId(object.TABLE_NAME)}`);
    }
    for (const object of objects.filter((item) => item.TABLE_TYPE === "BASE TABLE")) {
      await connection.query(`DROP TABLE IF EXISTS ${escapeId(object.TABLE_NAME)}`);
    }
  } finally {
    try {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    } finally {
      connection.release();
    }
  }

  await initializeDatabase();
  console.log(`Database reset complete. Backup kept at ${backupPath}.`);
} catch (error) {
  if (statSync(backupPath, { throwIfNoEntry: false })?.size === 0) unlinkSync(backupPath);
  throw error;
} finally {
  readline.close();
  unlinkSync(configPath);
  await closeDatabase();
}
