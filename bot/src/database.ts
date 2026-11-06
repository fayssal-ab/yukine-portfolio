import { readFileSync } from "node:fs";
import type { ExecuteValues } from "mysql2";
import { createPool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing MySQL settings in bot/.env: ${missing.join(", ")}`);
}

const caPath = process.env.DB_SSL_CA_PATH;
const ssl = caPath
  ? { ca: readFileSync(caPath, "utf8"), rejectUnauthorized: true }
  : { rejectUnauthorized: true };

export const db = createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl,
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 5,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

export async function initializeDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id VARCHAR(32) NOT NULL PRIMARY KEY,
      welcome_channel_id VARCHAR(32) NOT NULL,
      announcement_channel_id VARCHAR(32) NOT NULL,
      ticket_category_id VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(32) NOT NULL,
      user_id VARCHAR(32) NOT NULL,
      category ENUM('work', 'personal', 'preparation') NOT NULL,
      title VARCHAR(200) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      done_at DATETIME(3) NULL,
      INDEX tasks_owner_open (guild_id, user_id, done_at, category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const taskCategoryColumns = await rows<RowDataPacket & { COLUMN_TYPE: string }>(
    `SELECT COLUMN_TYPE FROM information_schema.columns
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'category'`,
  );
  if (taskCategoryColumns[0]?.COLUMN_TYPE === "enum('work','personal')") {
    await db.query(
      "ALTER TABLE tasks MODIFY category ENUM('work', 'personal', 'preparation') NOT NULL",
    );
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(32) NOT NULL,
      user_id VARCHAR(32) NOT NULL,
      message VARCHAR(200) NOT NULL,
      due_at DATETIME(3) NOT NULL,
      status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
      INDEX reminders_due (status, due_at),
      INDEX reminders_owner (guild_id, user_id, status, due_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      channel_id VARCHAR(32) NOT NULL PRIMARY KEY,
      guild_id VARCHAR(32) NOT NULL,
      owner_user_id VARCHAR(32) NOT NULL,
      status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
      created_at DATETIME(3) NOT NULL,
      INDEX tickets_owner_open (guild_id, owner_user_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function rows<T extends RowDataPacket>(sql: string, values: ExecuteValues[] = []): Promise<T[]> {
  const [result] = await db.execute<T[]>(sql, values);
  return result;
}

export async function execute(sql: string, values: ExecuteValues[] = []) {
  const [result] = await db.execute<ResultSetHeader>(sql, values);
  return result;
}

export async function closeDatabase() {
  await db.end();
}
