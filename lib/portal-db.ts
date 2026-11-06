import { readFileSync } from "node:fs";
import {
  createPool,
  type ExecuteValues,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

let pool: ReturnType<typeof createPool> | undefined;
let schemaReady: Promise<void> | undefined;
let lastRateLimitCleanup = 0;

function database() {
  if (pool) return pool;

  const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing database configuration: ${missing.join(", ")}`);
  }

  const ca = process.env.DB_SSL_CA_PATH
    ? readFileSync(process.env.DB_SSL_CA_PATH, "utf8")
    : process.env.DB_SSL_CA;

  pool = createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { ...(ca ? { ca } : {}), rejectUnauthorized: true },
    timezone: "Z",
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 20,
  });
  return pool;
}

export async function rows<T extends RowDataPacket>(
  sql: string,
  values: ExecuteValues[] = [],
): Promise<T[]> {
  const [result] = await database().execute<T[]>(sql, values);
  return result;
}

export async function execute(sql: string, values: ExecuteValues[] = []) {
  const [result] = await database().execute<ResultSetHeader>(sql, values);
  return result;
}

export async function ensurePortalTables() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = database();
      await db.query(`
        CREATE TABLE IF NOT EXISTS portfolio_admin_items (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          kind ENUM('task', 'note') NOT NULL,
          title VARCHAR(160) NOT NULL,
          content TEXT NOT NULL,
          is_done BOOLEAN NOT NULL DEFAULT FALSE,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
            ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX portfolio_items_kind_created (kind, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS portfolio_page_views (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          page_path VARCHAR(512) NOT NULL,
          viewed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          INDEX portfolio_views_time (viewed_at),
          INDEX portfolio_views_path_time (page_path, viewed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS portfolio_contact_events (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          INDEX portfolio_contacts_time (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS portfolio_rate_limits (
          identifier_hash CHAR(64) NOT NULL,
          action VARCHAR(32) NOT NULL,
          window_started_at DATETIME(3) NOT NULL,
          request_count INT UNSIGNED NOT NULL,
          PRIMARY KEY (identifier_hash, action),
          INDEX portfolio_rate_window (window_started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })().catch((error: unknown) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

export async function consumeRateLimit(
  identifierHash: string,
  action: string,
  windowSeconds: number,
) {
  const db = database();
  const resetBefore = new Date(Date.now() - windowSeconds * 1000);
  if (Date.now() - lastRateLimitCleanup > 30 * 60 * 1000) {
    await db.execute(
      "DELETE FROM portfolio_rate_limits WHERE window_started_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY)",
    );
    lastRateLimitCleanup = Date.now();
  }
  await db.execute(
    `INSERT INTO portfolio_rate_limits
       (identifier_hash, action, window_started_at, request_count)
     VALUES (?, ?, UTC_TIMESTAMP(3), 1)
     ON DUPLICATE KEY UPDATE
       request_count = IF(
         window_started_at < ?,
         1,
         request_count + 1
       ),
       window_started_at = IF(
         window_started_at < ?,
         UTC_TIMESTAMP(3),
         window_started_at
       )`,
    [identifierHash, action, resetBefore, resetBefore],
  );
  const [rows] = await db.execute<(RowDataPacket & { request_count: number })[]>(
    "SELECT request_count FROM portfolio_rate_limits WHERE identifier_hash = ? AND action = ?",
    [identifierHash, action],
  );
  return Number(rows[0]?.request_count ?? 0);
}

export async function recordPageView(pagePath: string) {
  await database().execute(
    "INSERT INTO portfolio_page_views (page_path) VALUES (?)",
    [pagePath],
  );
}

export async function recordContactEvent() {
  await database().execute("INSERT INTO portfolio_contact_events () VALUES ()");
}

export async function getPortfolioStats() {
  const db = database();
  const [totals] = await db.query<
    (RowDataPacket & { page_views: number; contact_requests: number })[]
  >(
    `SELECT
       (SELECT COUNT(*) FROM portfolio_page_views) AS page_views,
       (SELECT COUNT(*) FROM portfolio_contact_events) AS contact_requests`,
  );
  const [recent] = await db.query<
    (RowDataPacket & { page_views: number; contact_requests: number })[]
  >(
    `SELECT
       (SELECT COUNT(*) FROM portfolio_page_views
        WHERE viewed_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY)) AS page_views,
       (SELECT COUNT(*) FROM portfolio_contact_events
        WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY)) AS contact_requests`,
  );
  const [topPages] = await db.query<
    (RowDataPacket & { page_path: string; views: number })[]
  >(
    `SELECT page_path, COUNT(*) AS views
     FROM portfolio_page_views
     WHERE viewed_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY)
     GROUP BY page_path
     ORDER BY views DESC, page_path ASC
     LIMIT 8`,
  );
  return {
    allTime: totals[0],
    lastSevenDays: recent[0],
    topPages,
  };
}

export async function closePortalDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
    schemaReady = undefined;
    lastRateLimitCleanup = 0;
  }
}
