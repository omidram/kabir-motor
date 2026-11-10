import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcrypt";

const dbPath = path.join(process.cwd(), "database.sqlite");
const db = new Database(dbPath);

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  firstname TEXT,
  lastname TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  password TEXT,
  device_id TEXT DEFAULT NULL,
  brand TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  rule TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS request (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT,
  phone TEXT,
  device_id TEXT,
  brand TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

try {
  db.prepare(`ALTER TABLE users ADD COLUMN firstname TEXT`).run();
} catch {}

try {
  db.prepare(`ALTER TABLE users ADD COLUMN lastname TEXT`).run();
} catch {}

const adminExists = db
  .prepare("SELECT id FROM users WHERE rule = ? LIMIT 1")
  .get("admin");

if (!adminExists) {
  const hash = bcrypt.hashSync("123Admin123", 10);

  db.prepare(`
    INSERT INTO users (username, firstname, lastname, phone, email, password, rule)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "admin",
    "Admin",
    "User",
    "09377786386",
    "amirali.katebi5@gmail.com",
    hash,
    "admin"
  );
}

export default db;