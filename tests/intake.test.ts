import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const temp = mkdtempSync(join(tmpdir(), 'docloud-intake-'));
process.env.DATA_DIR = temp;
process.env.APP_URL = 'http://localhost:3270';
process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
test('public intake stores encrypted contacts and private photo without publishing or making an account', async () => {
  const { GET, POST } = await import('../app/api/[...path]/route');
  const { db, row } = await import('../lib/db');
  const { decrypt } = await import('../lib/security');
  const sharp = (await import('sharp')).default;
  const image = await sharp({ create: { width: 60, height: 40, channels: 3, background: '#cdc' } })
    .jpeg()
    .toBuffer();
  const data = {
    submissionId: randomUUID(),
    name: 'Persona de prueba',
    email: 'Intake@example.com',
    phone: '300 123 4567',
    dogName: 'Toby',
    breed: 'Jack Russell Terrier',
    age: 10,
    preference: 'both',
    photo: 'data:image/jpeg;base64,' + image.toString('base64'),
    consent: true,
    website: '',
    source: 'whatsapp',
  };
  async function call(
    path: string,
    body?: unknown,
    method = 'POST',
    origin = 'http://localhost:3270',
  ) {
    const req = new Request('http://localhost:3270/api/' + path, {
      method,
      headers: { origin, 'content-type': 'application/json', 'x-real-ip': 'intake-test' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const res = await (method === 'GET' ? GET : POST)(req, {
      params: Promise.resolve({ path: path.split('/') }),
    });
    return { status: res.status, data: await res.json(), headers: res.headers };
  }
  try {
    assert.equal((await call('intake', { ...data, consent: false })).status, 400);
    assert.equal((await call('intake', { ...data, phone: '12345' })).status, 400);
    assert.equal((await call('intake', data, 'POST', 'https://evil.example')).status, 403);
    const result = await call('intake', data);
    assert.equal(result.status, 201);
    assert.equal(result.headers.get('set-cookie'), null);
    assert.deepEqual(result.data, { ok: true });
    const saved = row<{
      id: string;
      contact: string;
      photo: string;
      dog_data: string;
      consent_text: string;
      consent_version: string;
    }>('SELECT * FROM intake_profiles')!;
    assert.ok(saved);
    assert.ok(!saved.contact.includes('example.com'));
    assert.ok(!saved.contact.includes('3001234567'));
    assert.deepEqual(JSON.parse(decrypt(saved.contact)), {
      name: 'Persona de prueba',
      email: 'intake@example.com',
      phone: '+573001234567',
    });
    assert.equal(JSON.parse(saved.dog_data).preference, 'both');
    assert.ok(saved.consent_text.includes('preperfil privado'));
    assert.ok(saved.consent_version);
    const photo = readFileSync(join(temp, 'intake-photos', saved.photo));
    assert.equal((await sharp(photo).metadata()).format, 'webp');
    assert.equal(row<{ n: number }>('SELECT COUNT(*) n FROM users')!.n, 0);
    assert.equal(row<{ n: number }>('SELECT COUNT(*) n FROM dogs')!.n, 0);
    assert.equal((await call('intake', undefined, 'GET')).status, 404);
    assert.equal((await call('media/' + saved.id, undefined, 'GET')).status, 404);
    const list = await call('dogs', undefined, 'GET');
    assert.ok(!JSON.stringify(list.data).includes('intake@example.com'));
    assert.ok(list.data.dogs.every((d: { demo: boolean }) => d.demo));
    assert.equal(
      (await call('intake', { ...data, name: 'No debe reemplazar', submissionId: randomUUID() }))
        .status,
      201,
    );
    assert.equal(row<{ n: number }>('SELECT COUNT(*) n FROM intake_profiles')!.n, 1);
    assert.equal(
      JSON.parse(decrypt(row<{ contact: string }>('SELECT contact FROM intake_profiles')!.contact))
        .name,
      'Persona de prueba',
    );
    assert.equal(readdirSync(join(temp, 'intake-photos')).length, 1);
    const svg =
      'data:image/jpeg;base64,' +
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>').toString(
        'base64',
      );
    assert.equal(
      (await call('intake', { ...data, dogName: 'Otro', submissionId: randomUUID(), photo: svg }))
        .status,
      400,
    );
    const trapped = await call('intake', {
      ...data,
      submissionId: randomUUID(),
      dogName: 'Spam',
      website: 'spam.example',
    });
    assert.equal(trapped.status, 201);
    assert.equal(row<{ n: number }>('SELECT COUNT(*) n FROM intake_profiles')!.n, 1);
    const request = await call('intake/privacy-request', {
      name: 'Persona de prueba',
      email: 'intake@example.com',
      action: 'delete',
      message: 'Quisiera solicitar la eliminación de mi registro.',
      consent: true,
      website: '',
    });
    assert.equal(request.status, 201);
    assert.ok(
      !row<{ details: string }>('SELECT details FROM intake_privacy_requests')!.details.includes(
        'example.com',
      ),
    );
    assert.equal(
      row<{ n: number }>('SELECT COUNT(*) n FROM intake_profiles')!.n,
      1,
      'privacy requests never delete before human identity verification',
    );
    const stats = JSON.parse(
      execFileSync(process.execPath, ['--import', 'tsx', 'scripts/intake.ts', 'stats'], {
        encoding: 'utf8',
        env: process.env,
      }),
    );
    assert.equal(stats.profiles.total, 1);
    assert.equal(stats.privacyRequests.pending, 1);
    assert.deepEqual(stats.sources, [{ source: 'whatsapp', total: 1 }]);
    const exportPath = join(temp, 'private-export.json');
    execFileSync(process.execPath, ['--import', 'tsx', 'scripts/intake.ts', 'export', exportPath], {
      env: process.env,
    });
    assert.equal(
      JSON.parse(readFileSync(exportPath, 'utf8'))[0].contact.email,
      'intake@example.com',
    );
  } finally {
    db().close();
    rmSync(temp, { recursive: true, force: true });
  }
});
