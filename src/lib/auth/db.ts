import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH =
  process.env.DB_PATH ||
  (() => {
    const dataPath = path.join(process.cwd(), "data", "app.db");
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const amveraPath = "/data/app.db";
    if (fs.existsSync(path.dirname(amveraPath))) return amveraPath;
    return dataPath;
  })();

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const instance = new Database(DB_PATH);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  initSchema(instance);
  // Assign after initSchema so a half-initialized DB is never cached
  db = instance;
  return instance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      email_verified INTEGER NOT NULL DEFAULT 0,
      totp_secret TEXT,
      totp_secret_expires_at INTEGER,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      recovery_codes TEXT DEFAULT '[]',
      password_changed_at TEXT,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('email_verify', 'password_reset', '2fa')),
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      href TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'expired', 'cancelled')),
      payment_id TEXT,
      amount REAL NOT NULL DEFAULT 999.00,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
      payment_method TEXT NOT NULL DEFAULT 'sbp',
      sbp_phone TEXT,
      sbp_qr_data TEXT,
      external_payment_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_type ON verification_tokens(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON subscriptions(payment_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_user_status_created ON payments(user_id, status, created_at);
    -- Частичный UNIQUE-индекс: один внешний ID платежа не может быть
    -- назначен двум строкам payments (вебхук ищет платеж по этому полю,
    -- неоднозначность соответствия означала бы рассинхрон данных)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_external_payment_id
      ON payments(external_payment_id) WHERE external_payment_id IS NOT NULL;
  `);

  // Миграция существующих баз: CREATE TABLE IF NOT EXISTS не добавит колонку
  // в старую таблицу. Перечисляем колонки, добавленные после публикации
  // первоначальной схемы — без них SELECT/UPDATE упадут с «no such column»
  const userColumns = db
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const userColumnNames = new Set(userColumns.map((c) => c.name));
  const userMigrations: Array<[string, string]> = [
    ["token_version", "INTEGER NOT NULL DEFAULT 0"],
    ["totp_secret", "TEXT"],
    ["totp_secret_expires_at", "INTEGER"],
    ["totp_enabled", "INTEGER NOT NULL DEFAULT 0"],
    ["recovery_codes", "TEXT DEFAULT '[]'"],
    ["password_changed_at", "TEXT"],
    ["email_verified", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [name, ddl] of userMigrations) {
    if (!userColumnNames.has(name)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${name} ${ddl}`);
    }
  }
}

/**
 * Переводит просроченные подписки в статус 'expired'. Статус 'active'
 * с прошедшим expires_at в БД не появляется иначе: вебхук и confirm
 * ставят 'active' с будущим сроком, но при продлении платёжного периода
 * («оплатил ещё раз через месяц») старый ряд остаётся 'active' навсегда.
 * Sweep вызывается на чтениях подписки — таблица маленькая, UPDATE по
 * индексу (status, expires_at) дёшев.
 */
export function expireSubscriptions(): void {
  getDb()
    .prepare(
      `UPDATE subscriptions SET status = 'expired', updated_at = datetime('now')
       WHERE status IN ('active', 'cancelled') AND expires_at <= datetime('now')`,
    )
    .run();
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

if (typeof process !== "undefined") {
  process.on("exit", closeDb);
}
