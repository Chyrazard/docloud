import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { db, dataDir, row, run } from './db';
const scrypt = promisify(scryptCb);
export function hash(v: string) {
  return createHash('sha256').update(v).digest('hex');
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, h] = stored.split(':');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(key, Buffer.from(h, 'hex'));
}
function encryptionKey() {
  if (process.env.ENCRYPTION_KEY) {
    if (!/^[a-f0-9]{64}$/i.test(process.env.ENCRYPTION_KEY))
      throw new Error('ENCRYPTION_KEY must be 32-byte hex');
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  if (process.env.NODE_ENV === 'production') throw new Error('ENCRYPTION_KEY is required');
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const p = resolve(dataDir, '.dev-key');
  if (!existsSync(p)) writeFileSync(p, randomBytes(32).toString('hex'), { mode: 0o600 });
  return Buffer.from(readFileSync(p, 'utf8'), 'hex');
}
export function encrypt(v: string) {
  const iv = randomBytes(12),
    c = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const value = Buffer.concat([c.update(v, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), value]).toString('base64');
}
export function decrypt(v: string) {
  const b = Buffer.from(v, 'base64'),
    c = createDecipheriv('aes-256-gcm', encryptionKey(), b.subarray(0, 12));
  c.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([c.update(b.subarray(28)), c.final()]).toString('utf8');
}
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newTotpSecret() {
  const bytes = randomBytes(20);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  return bits
    .match(/.{1,5}/g)!
    .map((b) => alphabet[parseInt(b.padEnd(5, '0'), 2)])
    .join('');
}
export function totp(secret: string, period = Math.floor(Date.now() / 30000)) {
  let bits = '';
  for (const c of secret) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const bytes = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const b = Buffer.alloc(8);
  b.writeBigUInt64BE(BigInt(period));
  const digest = createHmac('sha1', bytes).update(b).digest();
  const offset = digest[19] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}
export function checkTotp(secret: string, code: string, last = 0) {
  if (!/^\d{6}$/.test(code)) return 0;
  const now = Math.floor(Date.now() / 30000);
  for (const p of [now - 1, now, now + 1])
    if (p > last && timingSafeEqual(Buffer.from(totp(secret, p)), Buffer.from(code))) return p;
  return 0;
}
export function rateLimit(key: string, max = 30, window = 60000) {
  const now = Date.now();
  return db().transaction(() => {
    const r = row<{ count: number; reset_at: number }>('SELECT * FROM limits WHERE key=?', key);
    if (!r || r.reset_at < now) {
      run(
        'INSERT INTO limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,reset_at=excluded.reset_at',
        key,
        now + window,
      );
      return true;
    }
    if (r.count >= max) return false;
    run('UPDATE limits SET count=count+1 WHERE key=?', key);
    return true;
  })();
}
export type User = {
  id: string;
  name: string;
  email: string;
  city: string;
  totp: string | null;
  totp_pending: string | null;
  totp_last: number;
  identity_status: string;
  password: string;
  mfa: number;
};
export function sessionUser(req: Request) {
  const token = req.headers.get('cookie')?.match(/(?:^|;\s*)docloud_session=([^;]+)/)?.[1];
  if (!token) return undefined;
  return row<User>(
    'SELECT u.*,s.mfa FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?',
    hash(token),
    Date.now(),
  );
}
export function requireUser(req: Request, mfa = false) {
  const u = sessionUser(req);
  if (!u) throw new ApiError(401, 'Inicia sesión para continuar.');
  if (mfa && (!u.totp || !u.mfa))
    throw new ApiError(403, 'Activa la autenticación en dos pasos en Seguridad para continuar.');
  return u;
}
export function publicUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    city: u.city,
    mfaEnabled: !!u.totp,
    identityStatus: u.identity_status,
  };
}
export function createSession(userId: string, mfa: boolean) {
  const token = randomBytes(32).toString('hex');
  run('DELETE FROM sessions WHERE expires < ?', Date.now());
  run(
    'INSERT INTO sessions(token,user_id,mfa,expires) VALUES(?,?,?,?)',
    hash(token),
    userId,
    mfa ? 1 : 0,
    Date.now() + 7 * 86400000,
  );
  return `docloud_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
