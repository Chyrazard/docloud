import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dataDir, db, row, run } from './db';
import { ApiError, encrypt, hash, rateLimit } from './security';
import {
  INTAKE_CONSENT_VERSION,
  INTAKE_CONSENT,
  intakeSchema,
  privacyRequestSchema,
} from './intake';
export async function saveIntake(input: unknown, ip: string) {
  const b = intakeSchema.parse(input);
  if (b.website) return { ok: true };
  const fingerprint = hash(
    `${b.email}\n${b.phone}\n${b.dogName.normalize('NFKC').toLocaleLowerCase('es')}`,
  );
  if (
    row(
      'SELECT id FROM intake_profiles WHERE fingerprint=? OR submission_id=?',
      fingerprint,
      b.submissionId,
    )
  )
    return { ok: true };
  if (
    !rateLimit(`intake-create:${hash(b.email + '\n' + b.phone)}`, 6, 3600000) ||
    !rateLimit('intake-create:global', 300, 86400000)
  )
    throw new ApiError(429, 'Por ahora recibimos demasiados registros. Intenta más tarde.');
  const bytes = Buffer.from(b.photo.slice(b.photo.indexOf(',') + 1), 'base64');
  if (bytes.length > 5 * 1024 * 1024) throw new ApiError(413, 'Elige una foto de máximo 5 MB.');
  let image: Buffer;
  try {
    const photo = sharp(bytes, { limitInputPixels: 20000000 });
    const meta = await photo.metadata();
    if (!meta.format || !['jpeg', 'png', 'webp'].includes(meta.format)) throw new Error('format');
    image = await photo
      .rotate()
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError(400, 'No pudimos leer la foto. Elige otra imagen JPG, PNG o WebP.');
  }
  const id = randomUUID(),
    folder = resolve(dataDir, 'intake-photos'),
    filename = `${id}.webp`;
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await writeFile(resolve(folder, filename), image, { mode: 0o600 });
  try {
    const inserted = db().transaction(() => {
      if (
        row(
          'SELECT id FROM intake_profiles WHERE fingerprint=? OR submission_id=?',
          fingerprint,
          b.submissionId,
        )
      )
        return false;
      run(
        'INSERT INTO intake_profiles(id,submission_id,fingerprint,contact,dog_data,photo,source,consent_version,consent_text) VALUES(?,?,?,?,?,?,?,?,?)',
        id,
        b.submissionId,
        fingerprint,
        encrypt(JSON.stringify({ name: b.name, email: b.email, phone: b.phone })),
        JSON.stringify({ name: b.dogName, breed: b.breed, age: b.age, preference: b.preference }),
        filename,
        b.source,
        INTAKE_CONSENT_VERSION,
        INTAKE_CONSENT,
      );
      return true;
    })();
    if (!inserted) await unlink(resolve(folder, filename));
  } catch (e) {
    await unlink(resolve(folder, filename)).catch(() => {});
    throw e;
  }
  return { ok: true };
}
export function savePrivacyRequest(input: unknown, ip: string) {
  const b = privacyRequestSchema.parse(input);
  if (b.website) return { ok: true };
  if (!rateLimit(`intake-privacy:${ip}`, 8, 3600000))
    throw new ApiError(429, 'Espera un momento antes de enviar otra solicitud.');
  run(
    'INSERT INTO intake_privacy_requests(id,details) VALUES(?,?)',
    randomUUID(),
    encrypt(JSON.stringify({ name: b.name, email: b.email, action: b.action, message: b.message })),
  );
  return { ok: true };
}
