import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
export const dataDir = resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || './data');
const globalDb = globalThis as unknown as { docloudDb?: Database.Database };
export function db() {
  if (globalDb.docloudDb) return globalDb.docloudDb;
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const d = new Database(resolve(dataDir, 'docloud.sqlite'));
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');
  d.pragma('busy_timeout = 5000');
  d.exec(`
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,city TEXT NOT NULL DEFAULT '',totp TEXT,totp_pending TEXT,totp_last INTEGER NOT NULL DEFAULT 0,identity_status TEXT NOT NULL DEFAULT 'unverified',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),mfa INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS dogs(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),data TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS favorites(user_id TEXT NOT NULL REFERENCES users(id),dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,dog_id));
 CREATE TABLE IF NOT EXISTS proposals(id TEXT PRIMARY KEY,requester_id TEXT NOT NULL REFERENCES users(id),recipient_id TEXT NOT NULL REFERENCES users(id),requester_dog TEXT NOT NULL REFERENCES dogs(id),recipient_dog TEXT NOT NULL REFERENCES dogs(id),status TEXT NOT NULL DEFAULT 'pending',version INTEGER NOT NULL DEFAULT 1,last_by TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS revisions(proposal_id TEXT NOT NULL REFERENCES proposals(id),version INTEGER NOT NULL,author_id TEXT NOT NULL REFERENCES users(id),terms TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(proposal_id,version));
 CREATE TABLE IF NOT EXISTS agreements(id TEXT PRIMARY KEY,proposal_id TEXT UNIQUE NOT NULL REFERENCES proposals(id),terms TEXT NOT NULL,terms_hash TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'awaiting_verification',payment_status TEXT NOT NULL DEFAULT 'unavailable',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,agreement_id TEXT NOT NULL REFERENCES agreements(id),author_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,note TEXT NOT NULL,due_at TEXT,image TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),message TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS uploads(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,agreement_id TEXT REFERENCES agreements(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS puppies(id TEXT PRIMARY KEY,agreement_id TEXT NOT NULL REFERENCES agreements(id),data TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),subject TEXT NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS proposals_recipient ON proposals(recipient_id);
 CREATE INDEX IF NOT EXISTS proposals_requester ON proposals(requester_id);
 CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id);
 `);
  globalDb.docloudDb = d;
  return d;
}
export function row<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T | undefined {
  return db()
    .prepare(sql)
    .get(...args) as T | undefined;
}
export function rows<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T[] {
  return db()
    .prepare(sql)
    .all(...args) as T[];
}
export function run(sql: string, ...args: unknown[]) {
  return db()
    .prepare(sql)
    .run(...args);
}
