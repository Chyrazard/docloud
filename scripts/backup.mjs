import Database from 'better-sqlite3';
import { mkdir, readdir, unlink, copyFile, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const dir = resolve(process.env.DATA_DIR || './data');
const dest = resolve(process.env.BACKUP_DIR || './data/backups');
await mkdir(dest, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, '-'),
  target = resolve(dest, stamp);
await mkdir(target, { mode: 0o700 });
const db = new Database(resolve(dir, 'docloud.sqlite'), { readonly: true });
await db.backup(resolve(target, 'docloud.sqlite'));
db.close();
try {
  await cp(resolve(dir, 'uploads'), resolve(target, 'uploads'), { recursive: true });
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const backups = (await readdir(dest)).filter((v) => /^\d{4}-/.test(v)).sort();
const { rm } = await import('node:fs/promises');
for (const old of backups.slice(0, -7)) await rm(resolve(dest, old), { recursive: true });
console.log('Backup completed:', target);
