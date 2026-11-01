import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
const temp = mkdtempSync(join(tmpdir(), 'docloud-test-'));
process.env.DATA_DIR = temp;
process.env.APP_URL = 'http://localhost:3270';
process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
test('two accounts negotiate, lock a version and protect private evidence', async () => {
  const { GET, POST, DELETE } = await import('../app/api/[...path]/route');
  const { totp } = await import('../lib/security');
  const { defaultTerms } = await import('../lib/domain');
  const { db, row } = await import('../lib/db');
  type Client = { cookie: string };
  const secrets: string[] = [];
  const a: Client = { cookie: '' },
    b: Client = { cookie: '' },
    c: Client = { cookie: '' };
  async function call(
    client: Client,
    path: string,
    method = 'GET',
    body?: unknown,
    origin = 'http://localhost:3270',
  ) {
    const req = new Request(`http://localhost:3270/api/${path}`, {
      method,
      headers: {
        origin,
        'content-type': 'application/json',
        cookie: client.cookie,
        'x-real-ip': 'test',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const res = await (method === 'GET' ? GET : method === 'DELETE' ? DELETE : POST)(req, {
      params: Promise.resolve({ path: path.split('/') }),
    });
    const cookie = res.headers.get('set-cookie');
    if (cookie) client.cookie = cookie.split(';')[0];
    return { status: res.status, data: await res.json(), res };
  }
  try {
    assert.equal((await call(a, 'dogs', 'POST', {})).status, 401);
    for (const [i, client] of [a, b, c].entries()) {
      assert.equal(
        (
          await call(client, 'auth/register', 'POST', {
            name: 'Persona ' + i,
            email: `person${i}@example.com`,
            password: 'a long secure password 123',
            city: 'Bogotá',
            consent: true,
          })
        ).status,
        201,
      );
      assert.equal((await call(client, 'dogs', 'POST', {})).status, 403);
      const setup = await call(client, 'auth/mfa', 'POST', {});
      assert.ok(setup.data.qr.startsWith('data:image/png'));
      secrets.push(setup.data.secret);
      assert.equal(
        (await call(client, 'auth/mfa', 'POST', { code: totp(setup.data.secret) })).status,
        200,
      );
      assert.equal((await call(client, 'auth/me')).data.user.mfaEnabled, true);
    }
    const makeDog = (name: string, sex: string) => ({
      name,
      breed: 'Terrier',
      sex,
      age: 3,
      city: 'Bogotá',
      bio: 'Un perro muy sociable y juguetón para este test.',
      image: '/images/milo-jack.jpg',
      pedigree: false,
      mode: 'money',
      amount: 350000,
      intention: 'charge',
      guardianConsent: true,
      welfareConsent: true,
    });
    const dogA = await call(a, 'dogs', 'POST', makeDog('Toby', 'male')),
      dogB = await call(b, 'dogs', 'POST', makeDog('Luna', 'female'));
    assert.equal(dogA.status, 201);
    assert.equal(dogB.status, 201);
    assert.equal(
      (await call(a, 'dogs', 'POST', makeDog('Otro', 'male'), 'https://evil.example')).status,
      403,
    );
    const result = await call(a, 'proposals', 'POST', {
      requesterDog: dogA.data.dog.id,
      recipientDog: dogB.data.dog.id,
      terms: { ...defaultTerms, payer: 'recipient', amount: 350000 },
    });
    assert.equal(result.status, 201);
    const pid = result.data.id;
    assert.equal((await call(a, `proposals/${pid}/accept`, 'POST', { version: 1 })).status, 409);
    assert.equal((await call(c, `proposals/${pid}/accept`, 'POST', { version: 1 })).status, 404);
    assert.equal(
      (
        await call(b, `proposals/${pid}/counter`, 'POST', {
          version: 1,
          terms: { ...defaultTerms, payer: 'recipient', amount: 250000 },
        })
      ).status,
      200,
    );
    assert.equal((await call(a, `proposals/${pid}/accept`, 'POST', { version: 1 })).status, 409);
    const accept = await call(a, `proposals/${pid}/accept`, 'POST', { version: 2 });
    assert.equal(accept.status, 200);
    const aid = accept.data.agreementId;
    assert.equal((await call(a, `proposals/${pid}/accept`, 'POST', { version: 2 })).status, 409);
    assert.equal(
      (await call(a, `proposals/${pid}/counter`, 'POST', { version: 2, terms: defaultTerms }))
        .status,
      409,
    );
    const agreement = (await call(a, 'agreements')).data.agreements[0];
    assert.equal(agreement.terms.amount, 250000);
    assert.equal(agreement.payment_status, 'unavailable');
    assert.equal(
      agreement.terms_hash,
      createHash('sha256').update(JSON.stringify(agreement.terms)).digest('hex'),
    );
    assert.equal((await call(c, 'agreements')).data.agreements.length, 0);
    assert.equal((await call(c, `agreements/${aid}/export`)).status, 404);
    assert.equal(
      (
        await call(c, `agreements/${aid}/events`, 'POST', {
          kind: 'note',
          note: 'Intento de acceso sin permiso.',
        })
      ).status,
      404,
    );
    const sharp = (await import('sharp')).default;
    const photo = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#abc' },
    })
      .jpeg()
      .toBuffer();
    const upload = await call(a, 'upload', 'POST', {
      kind: 'evidence',
      agreementId: aid,
      data: 'data:image/jpeg;base64,' + photo.toString('base64'),
    });
    assert.equal(upload.status, 200);
    const imageId = upload.data.url.split('/').pop();
    const noAccess = new Request('http://localhost:3270/api/media/' + imageId, {
      headers: { cookie: c.cookie, 'x-real-ip': 'media-test' },
    });
    assert.equal(
      (await GET(noAccess, { params: Promise.resolve({ path: ['media', imageId] }) })).status,
      404,
    );
    const allowed = new Request('http://localhost:3270/api/media/' + imageId, {
      headers: { cookie: b.cookie, 'x-real-ip': 'media-test' },
    });
    const media = await GET(allowed, { params: Promise.resolve({ path: ['media', imageId] }) });
    assert.equal(media.status, 200);
    assert.equal(media.headers.get('cache-control'), 'private, no-store');
    assert.equal(
      (
        await call(a, `agreements/${aid}/events`, 'POST', {
          kind: 'meeting',
          note: 'Nos encontramos. Registro aportado para el seguimiento.',
          image: upload.data.url,
        })
      ).status,
      200,
    );
    assert.equal((await call(b, 'agreements')).data.agreements[0].events.length, 1);
    const pup = {
      name: 'Nube',
      sex: 'female',
      bornAt: '2026-10-31',
      status: 'care',
      home: '',
      notes: 'Seguimiento de ejemplo.',
    };
    assert.equal((await call(c, `agreements/${aid}/puppies`, 'POST', pup)).status, 404);
    assert.equal((await call(a, `agreements/${aid}/puppies`, 'POST', pup)).status, 200);
    const puppy = (await call(b, 'agreements')).data.agreements[0].puppies[0];
    assert.equal(puppy.name, 'Nube');
    assert.equal(
      (
        await call(b, `agreements/${aid}/puppies/${puppy.id}`, 'POST', {
          ...pup,
          status: 'home',
          home: 'Familia de Laura',
          version: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(a, `agreements/${aid}/puppies/${puppy.id}`, 'POST', { ...pup, version: 1 }))
        .status,
      409,
    );
    assert.equal(
      (await call(a, `agreements/${aid}/puppies`, 'POST', { ...pup, status: 'home' })).status,
      400,
    );
    assert.equal((await call(a, `agreements/${aid}/pay`, 'POST', {})).status, 503);
    assert.equal((await call(a, `dogs/${dogA.data.dog.id}`, 'DELETE')).status, 409);
    assert.equal((await call(c, `dogs/${dogA.data.dog.id}`, 'DELETE')).status, 404);
    const publicDogs = (await call({ cookie: '' }, 'dogs')).data.dogs;
    assert.ok(
      publicDogs.every((d: Record<string, unknown>) => !('email' in d) && !('password' in d)),
    );
    assert.ok((await call(b, 'notifications')).data.notifications.length >= 3);
    const password = row<{ password: string }>(
      'SELECT password FROM users WHERE email=?',
      'person0@example.com',
    )!.password;
    assert.ok(!password.includes('a long secure password'));
    await call(a, 'auth/logout', 'POST', {});
    assert.equal((await call(a, 'proposals')).status, 401);
    const login = await call(a, 'auth/login', 'POST', {
      email: 'person0@example.com',
      password: 'a long secure password 123',
    });
    assert.equal(login.data.requiresMfa, true);
    assert.equal((await call(a, 'auth/me')).data.user, null);
    const nextCode = totp(secrets[0], Math.floor(Date.now() / 30000) + 1);
    assert.equal(
      (
        await call(a, 'auth/login', 'POST', {
          email: 'person0@example.com',
          password: 'a long secure password 123',
          code: nextCode,
        })
      ).status,
      200,
    );
    assert.ok((await call(a, 'auth/me')).data.user);
    await call(a, 'auth/logout', 'POST', {});
    assert.equal(
      (
        await call(a, 'auth/login', 'POST', {
          email: 'person0@example.com',
          password: 'a long secure password 123',
          code: nextCode,
        })
      ).status,
      401,
    );
  } finally {
    db().close();
    rmSync(temp, { recursive: true, force: true });
  }
});
