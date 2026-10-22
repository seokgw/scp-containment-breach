import { DatabaseSync } from "node:sqlite";
import { challenges } from "./catalog.mjs";
const tables = new Set([
  "users",
  "sessions",
  "progress",
  "hints",
  "submissions",
]);
export class SQLiteRepository {
  constructor(path = ":memory:") {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,codename TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS progress(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,challenge_id INTEGER,solved_at TEXT,PRIMARY KEY(user_id,challenge_id));
      CREATE TABLE IF NOT EXISTS hints(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,challenge_id INTEGER,level INTEGER,PRIMARY KEY(user_id,challenge_id,level));
      CREATE TABLE IF NOT EXISTS submissions(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,challenge_id INTEGER,is_correct INTEGER,submitted_at TEXT);
      CREATE TABLE IF NOT EXISTS rate_buckets(key TEXT PRIMARY KEY,count INTEGER,expires INTEGER);`);
    if (!this.db.prepare("PRAGMA table_info(users)").all().some(c => c.name === "role"))
      this.db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'agent' CHECK(role IN ('agent','admin'))");
  }
  filters(table, filters) {
    if (
      !tables.has(table) ||
      Object.keys(filters).some((k) => !/^\w+$/.test(k))
    )
      throw Error("Invalid identifier");
    return Object.keys(filters)
      .map((k) => `${k}=?`)
      .join(" AND ");
  }
  async select(table, filters = {}) {
    const clause = this.filters(table, filters);
    return this.db
      .prepare(`SELECT * FROM ${table}${clause ? " WHERE " + clause : ""}`)
      .all(...Object.values(filters));
  }
  async insert(table, row, ignore = false) {
    this.filters(table, row);
    const values = Object.values(row).map((v) =>
      typeof v === "boolean" ? Number(v) : v,
    );
    try {
      return this.db
        .prepare(
          `INSERT ${ignore ? "OR IGNORE " : ""}INTO ${table} (${Object.keys(row).join(",")}) VALUES (${values.map(() => "?")}) RETURNING *`,
        )
        .all(...values);
    } catch (e) {
      if (String(e.message).includes("UNIQUE")) e.code = "23505";
      throw e;
    }
  }
  async remove(table, filters) {
    const clause = this.filters(table, filters);
    if (!clause) throw Error("Unsafe delete");
    this.db
      .prepare(`DELETE FROM ${table} WHERE ${clause}`)
      .run(...Object.values(filters));
  }
  async rate(key, limit, seconds) {
    const now = Date.now();
    const r = this.db
      .prepare(
        `INSERT INTO rate_buckets(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count`,
      )
      .get(key, now + seconds * 1000, now, now);
    return r.count <= limit;
  }
  async rankings() {
    const cases = challenges
      .map((c) => `WHEN ${c.id} THEN ${c.points}`)
      .join(" ");
    return this.db
      .prepare(
        `SELECT u.codename,coalesce(sum(CASE p.challenge_id ${cases} ELSE 0 END),0) score,count(p.challenge_id) solved,max(p.solved_at) last_solved FROM users u LEFT JOIN progress p ON p.user_id=u.id WHERE u.role='agent' GROUP BY u.id ORDER BY score DESC,last_solved ASC NULLS LAST,u.codename ASC LIMIT 50`,
      )
      .all();
  }
}
