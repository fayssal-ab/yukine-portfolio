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
    : normalizeCertificate(process.env.DB_SSL_CA);

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
    connectTimeout: 8000,
  });
  return pool;
}

/**
 * Hosting dashboards mangle multi-line PEM values: accept the raw certificate,
 * one with literal "\\n" escapes, wrapped in quotes, or base64-encoded.
 */
function normalizeCertificate(value: string | undefined) {
  if (!value) return undefined;
  let pem = value.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n").replace(/\r/g, "");
  if (!pem.includes("-----BEGIN")) {
    const decoded = Buffer.from(pem, "base64").toString("utf8");
    if (decoded.includes("-----BEGIN")) pem = decoded.trim();
  }
  // a certificate pasted on one line: put the base64 body back on its own lines
  pem = pem.replace(/(-----BEGIN [A-Z ]+-----)\s*([\s\S]*?)\s*(-----END [A-Z ]+-----)/g, (_, head: string, body: string, tail: string) =>
    `${head}\n${body.replace(/\s+/g, "").replace(/(.{64})/g, "$1\n").trim()}\n${tail}`,
  );
  return `${pem}\n`;
}

/** Turns a database failure into a short reason that is safe to show the site owner. */
export function describeDbError(error: unknown): string {
  const err = error as { code?: string; message?: string } | undefined;
  const code = err?.code ?? "";
  const message = err?.message ?? "";
  if (message.startsWith("Missing database configuration")) return `${message}. Add them in Netlify → Environment variables (scope: Functions) and redeploy.`;
  if (["ENOTFOUND", "EAI_AGAIN"].includes(code)) return "Database host not found: check DB_HOST.";
  if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "PROTOCOL_CONNECTION_LOST"].includes(code) || /timeout/i.test(message))
    return "Cannot reach the database: check DB_HOST/DB_PORT and that the Aiven service is running (free services power off when idle).";
  if (code === "ER_ACCESS_DENIED_ERROR") return "Database rejected the login: check DB_USER and DB_PASSWORD.";
  if (code === "ER_BAD_DB_ERROR") return "Database name not found: check DB_NAME.";
  if (code === "ER_DBACCESS_DENIED_ERROR" || code === "ER_TABLEACCESS_DENIED_ERROR") return "The database user lacks permission to create or use the tables.";
  if (/CERT|SELF_SIGNED|UNABLE_TO_VERIFY|certificate/i.test(code + message))
    return "TLS certificate check failed: set DB_SSL_CA to the Aiven CA certificate (ca.pem contents).";
  if (/PEM|asn1|OSSL/i.test(code + message)) return "DB_SSL_CA is not a valid certificate: paste the full ca.pem contents.";
  return `Database error${code ? ` (${code})` : ""}.`;
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
  const [daily] = await db.query<(RowDataPacket & { day: string; views: number })[]>(
    `SELECT DATE_FORMAT(viewed_at, '%Y-%m-%d') AS day, COUNT(*) AS views
     FROM portfolio_page_views
     WHERE viewed_at >= DATE_SUB(UTC_DATE(), INTERVAL 13 DAY)
     GROUP BY day`,
  );
  return {
    allTime: totals[0],
    lastSevenDays: recent[0],
    topPages,
    daily,
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
