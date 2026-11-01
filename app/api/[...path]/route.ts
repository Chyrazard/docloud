import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { z } from 'zod';
import { db, row, rows, run, dataDir } from '@/lib/db';
import {
  ApiError,
  checkTotp,
  createSession,
  decrypt,
  encrypt,
  hash,
  hashPassword,
  newTotpSecret,
  publicUser,
  rateLimit,
  requireUser,
  sessionUser,
  verifyPassword,
} from '@/lib/security';
import { canRespond, dogSchema, termsSchema, puppySchema } from '@/lib/domain';
import { demoDogs } from '@/lib/demo';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Proposal = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_dog: string;
  recipient_dog: string;
  last_by: string;
  status: string;
  version: number;
};
type Agreement = {
  id: string;
  proposal_id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
};
function notify(user: string, message: string) {
  run('INSERT INTO notifications(id,user_id,message) VALUES(?,?,?)', randomUUID(), user, message);
}
function dogData(r: Record<string, unknown>) {
  return {
    ...JSON.parse(r.data as string),
    id: r.id,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    demo: false,
    createdAt: r.created_at,
  };
}
function agreementFor(id: string, uid: string) {
  const a = row<Agreement>(
    'SELECT a.*,p.requester_id,p.recipient_id FROM agreements a JOIN proposals p ON p.id=a.proposal_id WHERE a.id=?',
    id,
  );
  if (!a || ![a.requester_id, a.recipient_id].includes(uid))
    throw new ApiError(404, 'Acuerdo no encontrado.');
  return a;
}
function proposalFor(id: string, uid: string) {
  const p = row<Proposal>('SELECT * FROM proposals WHERE id=?', id);
  if (!p || ![p.requester_id, p.recipient_id].includes(uid))
    throw new ApiError(404, 'Propuesta no encontrada.');
  return p;
}
async function body(req: Request) {
  const limit = 8 * 1024 * 1024;
  if (Number(req.headers.get('content-length') || 0) > limit)
    throw new ApiError(413, 'El archivo supera el límite de 5 MB.');
  const reader = req.body?.getReader();
  if (!reader) return {};
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new ApiError(413, 'Solicitud demasiado grande.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new ApiError(400, 'Solicitud inválida.');
  }
}
const account = z.object({
  name: z.string().trim().min(2).max(70),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
  city: z.string().trim().min(2).max(60),
  consent: z.literal(true),
});
async function handler(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const [resource, id, action] = path;
    const method = req.method;
    if (method !== 'GET') {
      const origin = req.headers.get('origin');
      const allowed = process.env.APP_URL || new URL(req.url).origin;
      if (!origin || origin !== allowed)
        throw new ApiError(403, 'Origen de solicitud no autorizado.');
    }
    const ip = req.headers.get('x-real-ip') || 'local';
    if (!rateLimit(`${method}:${resource}:${ip}`, resource === 'auth' ? 35 : 150, 60000))
      throw new ApiError(429, 'Demasiados intentos. Espera un minuto.');
    if (resource === 'health' && method === 'GET') {
      row('SELECT 1');
      return NextResponse.json({ ok: true, service: 'docloud' });
    }
    if (resource === 'auth') {
      if (id === 'me' && method === 'GET') {
        const u = sessionUser(req);
        return NextResponse.json({ user: u ? publicUser(u) : null });
      }
      if (id === 'register' && method === 'POST') {
        const b = account.parse(await body(req));
        if (!rateLimit(`register:${ip}`, 8, 3600000))
          throw new ApiError(429, 'Límite de registros alcanzado. Intenta más tarde.');
        if (row('SELECT id FROM users WHERE email=?', b.email))
          throw new ApiError(
            409,
            'No es posible registrar esta cuenta. Si ya tienes una, inicia sesión.',
          );
        const uid = randomUUID();
        run(
          'INSERT INTO users(id,name,email,password,city) VALUES(?,?,?,?,?)',
          uid,
          b.name,
          b.email,
          await hashPassword(b.password),
          b.city,
        );
        notify(
          uid,
          '¡Bienvenido a DOCLOUD! Activa el segundo factor y crea el perfil de tu compañero.',
        );
        return NextResponse.json(
          {
            user: {
              id: uid,
              name: b.name,
              email: b.email,
              city: b.city,
              mfaEnabled: false,
              identityStatus: 'unverified',
            },
          },
          { status: 201, headers: { 'Set-Cookie': createSession(uid, false) } },
        );
      }
      if (id === 'login' && method === 'POST') {
        const b = z
          .object({
            email: z.email().transform((v) => v.toLowerCase()),
            password: z.string().max(128),
            code: z.string().max(6).optional(),
          })
          .parse(await body(req));
        if (!rateLimit(`login:${hash(b.email)}:${ip}`, 8, 900000))
          throw new ApiError(429, 'Espera 15 minutos antes de volver a intentarlo.');
        const u = row<import('@/lib/security').User>('SELECT * FROM users WHERE email=?', b.email);
        const passwordOk = await verifyPassword(
          b.password,
          u?.password ||
            '00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        );
        if (!u || !passwordOk) throw new ApiError(401, 'Correo o contraseña incorrectos.');
        if (u.totp) {
          if (!b.code) return NextResponse.json({ requiresMfa: true });
          const p = checkTotp(decrypt(u.totp), b.code, u.totp_last);
          if (
            !p ||
            !run('UPDATE users SET totp_last=? WHERE id=? AND totp_last<?', p, u.id, p).changes
          )
            throw new ApiError(
              401,
              'Código incorrecto o ya utilizado. Espera al siguiente código.',
            );
        }
        return NextResponse.json(
          { user: publicUser(u) },
          { headers: { 'Set-Cookie': createSession(u.id, !!u.totp) } },
        );
      }
      if (id === 'logout' && method === 'POST') {
        const token = req.headers.get('cookie')?.match(/(?:^|;\s*)docloud_session=([^;]+)/)?.[1];
        if (token) run('DELETE FROM sessions WHERE token=?', hash(token));
        return NextResponse.json(
          { ok: true },
          {
            headers: {
              'Set-Cookie': 'docloud_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
            },
          },
        );
      }
      if (id === 'mfa' && method === 'POST') {
        const u = requireUser(req);
        if (u.totp) throw new ApiError(409, 'Ya tienes el segundo factor activo.');
        const b = await body(req);
        if (b.code) {
          if (!u.totp_pending) throw new ApiError(400, 'Primero genera el código QR.');
          const period = checkTotp(decrypt(u.totp_pending), String(b.code));
          if (!period) throw new ApiError(400, 'El código no coincide.');
          db().transaction(() => {
            run(
              'UPDATE users SET totp=totp_pending,totp_pending=NULL,totp_last=? WHERE id=?',
              period,
              u.id,
            );
            const token = req.headers
              .get('cookie')
              ?.match(/(?:^|;\s*)docloud_session=([^;]+)/)?.[1];
            if (token) run('UPDATE sessions SET mfa=1 WHERE token=?', hash(token));
          })();
          return NextResponse.json({ ok: true });
        }
        const secret = newTotpSecret();
        run('UPDATE users SET totp_pending=? WHERE id=?', encrypt(secret), u.id);
        const uri = `otpauth://totp/DOCLOUD:${encodeURIComponent(u.email)}?secret=${secret}&issuer=DOCLOUD&algorithm=SHA1&digits=6&period=30`;
        return NextResponse.json({
          secret,
          qr: await QRCode.toDataURL(uri, { width: 240, margin: 2 }),
        });
      }
    }
    if (resource === 'dogs') {
      if (method === 'GET') {
        const dogs = rows(
          'SELECT d.*,u.name owner_name FROM dogs d JOIN users u ON u.id=d.owner_id ORDER BY d.created_at DESC',
        ).map(dogData);
        return NextResponse.json({ dogs: [...dogs, ...demoDogs] });
      }
      if (method === 'POST') {
        const u = requireUser(req, true);
        const b = dogSchema.parse(await body(req));
        if (!b.image.startsWith('/images/') && !/^\/api\/media\/[a-f0-9-]{36}$/.test(b.image))
          throw new ApiError(400, 'Sube una foto válida.');
        if (b.image.startsWith('/api/media/')) {
          const image = row(
            'SELECT id FROM uploads WHERE id=? AND user_id=? AND kind=?',
            b.image.split('/').pop(),
            u.id,
            'pet',
          );
          if (!image) throw new ApiError(400, 'La foto no pertenece a tu cuenta.');
        }
        if (row<{ n: number }>('SELECT COUNT(*) n FROM dogs WHERE owner_id=?', u.id)!.n >= 20)
          throw new ApiError(400, 'Puedes registrar hasta 20 mascotas.');
        const dogId = randomUUID();
        run('INSERT INTO dogs(id,owner_id,data) VALUES(?,?,?)', dogId, u.id, JSON.stringify(b));
        return NextResponse.json(
          {
            dog: {
              ...b,
              id: dogId,
              ownerId: u.id,
              ownerName: u.name,
              demo: false,
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }
      if (method === 'DELETE' && id) {
        const u = requireUser(req, true);
        if (!row('SELECT id FROM dogs WHERE id=? AND owner_id=?', id, u.id))
          throw new ApiError(404, 'Mascota no encontrada.');
        if (row('SELECT id FROM proposals WHERE requester_dog=? OR recipient_dog=?', id, id))
          throw new ApiError(
            409,
            'Esta mascota forma parte de un historial de propuestas y no se puede eliminar.',
          );
        run('DELETE FROM dogs WHERE id=? AND owner_id=?', id, u.id);
        return NextResponse.json({ ok: true });
      }
    }
    if (resource === 'favorites') {
      const u = requireUser(req);
      if (method === 'GET')
        return NextResponse.json({
          ids: rows<{ dog_id: string }>('SELECT dog_id FROM favorites WHERE user_id=?', u.id).map(
            (r) => r.dog_id,
          ),
        });
      if (method === 'POST') {
        const b = z.object({ dogId: z.uuid() }).parse(await body(req));
        if (!row('SELECT id FROM dogs WHERE id=?', b.dogId))
          throw new ApiError(404, 'Perfil no encontrado.');
        if (row('SELECT dog_id FROM favorites WHERE user_id=? AND dog_id=?', u.id, b.dogId))
          run('DELETE FROM favorites WHERE user_id=? AND dog_id=?', u.id, b.dogId);
        else run('INSERT INTO favorites(user_id,dog_id) VALUES(?,?)', u.id, b.dogId);
        return NextResponse.json({ ok: true });
      }
    }
    if (resource === 'proposals') {
      const u = requireUser(req);
      if (method === 'GET')
        return NextResponse.json({
          proposals: rows<Proposal>(
            'SELECT * FROM proposals WHERE requester_id=? OR recipient_id=? ORDER BY updated_at DESC',
            u.id,
            u.id,
          ).map((p) => ({
            ...p,
            revisions: rows(
              'SELECT version,author_id,terms,created_at FROM revisions WHERE proposal_id=? ORDER BY version',
              p.id,
            ).map((r) => ({ ...r, terms: JSON.parse(r.terms as string) })),
          })),
        });
      requireUser(req, true);
      if (method === 'POST' && !id) {
        const b = z
          .object({ requesterDog: z.uuid(), recipientDog: z.uuid(), terms: termsSchema })
          .parse(await body(req));
        const own = row<{ owner_id: string; data: string }>(
            'SELECT owner_id,data FROM dogs WHERE id=?',
            b.requesterDog,
          ),
          other = row<{ owner_id: string; data: string }>(
            'SELECT owner_id,data FROM dogs WHERE id=?',
            b.recipientDog,
          );
        if (!own || own.owner_id !== u.id || !other || other.owner_id === u.id)
          throw new ApiError(400, 'Selecciona tu mascota y una de otra persona.');
        if (JSON.parse(own.data).sex === JSON.parse(other.data).sex)
          throw new ApiError(400, 'Esta solicitud requiere mascotas de distinto sexo.');
        const pid = randomUUID();
        db().transaction(() => {
          if (
            row(
              'SELECT id FROM proposals WHERE status=? AND ((requester_dog=? AND recipient_dog=?) OR (requester_dog=? AND recipient_dog=?))',
              'pending',
              b.requesterDog,
              b.recipientDog,
              b.recipientDog,
              b.requesterDog,
            )
          )
            throw new ApiError(409, 'Ya hay una propuesta pendiente entre estas mascotas.');
          run(
            'INSERT INTO proposals(id,requester_id,recipient_id,requester_dog,recipient_dog,last_by) VALUES(?,?,?,?,?,?)',
            pid,
            u.id,
            other.owner_id,
            b.requesterDog,
            b.recipientDog,
            u.id,
          );
          run(
            'INSERT INTO revisions(proposal_id,version,author_id,terms) VALUES(?,1,?,?)',
            pid,
            u.id,
            JSON.stringify(b.terms),
          );
          notify(
            other.owner_id,
            `${u.name} te envió una propuesta. Revisa las condiciones antes de responder.`,
          );
        })();
        return NextResponse.json({ id: pid }, { status: 201 });
      }
      if (method === 'POST' && id) {
        const b = z
          .object({ version: z.number().int().positive(), terms: termsSchema.optional() })
          .parse(await body(req));
        return db().transaction(() => {
          const p = proposalFor(id, u.id);
          if (action === 'cancel') {
            if (p.status !== 'pending' || p.version !== b.version)
              throw new ApiError(409, 'La propuesta cambió. Actualiza la página.');
            run(
              'UPDATE proposals SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
              'cancelled',
              id,
            );
            notify(
              p.requester_id === u.id ? p.recipient_id : p.requester_id,
              'Una propuesta fue cancelada.',
            );
            return NextResponse.json({ ok: true });
          }
          if (!canRespond(u.id, p, b.version, p.version))
            throw new ApiError(409, 'Esta versión ya cambió o no es tu turno de responder.');
          const other = p.requester_id === u.id ? p.recipient_id : p.requester_id;
          if (action === 'counter') {
            if (!b.terms) throw new ApiError(400, 'Faltan las condiciones.');
            const version = p.version + 1;
            run(
              'INSERT INTO revisions(proposal_id,version,author_id,terms) VALUES(?,?,?,?)',
              id,
              version,
              u.id,
              JSON.stringify(b.terms),
            );
            run(
              'UPDATE proposals SET version=?,last_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
              version,
              u.id,
              id,
            );
            notify(
              other,
              `${u.name} envió una contrapropuesta. Hay una nueva versión para revisar.`,
            );
            return NextResponse.json({ ok: true });
          }
          if (action === 'decline') {
            run(
              'UPDATE proposals SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
              'declined',
              id,
            );
            notify(other, 'Tu propuesta fue rechazada. Puedes explorar otras opciones.');
            return NextResponse.json({ ok: true });
          }
          if (action === 'accept') {
            const revision = row<{ terms: string }>(
              'SELECT terms FROM revisions WHERE proposal_id=? AND version=?',
              id,
              p.version,
            )!;
            const aid = randomUUID();
            run(
              'UPDATE proposals SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
              'accepted',
              id,
            );
            run(
              'INSERT INTO agreements(id,proposal_id,terms,terms_hash) VALUES(?,?,?,?)',
              aid,
              id,
              revision.terms,
              hash(revision.terms),
            );
            notify(
              other,
              '¡Ambas partes aceptaron! El acuerdo está guardado; faltan las validaciones previas al encuentro.',
            );
            return NextResponse.json({ ok: true, agreementId: aid });
          }
          throw new ApiError(404, 'Acción no encontrada.');
        })();
      }
    }
    if (resource === 'agreements') {
      const u = requireUser(req);
      if (method === 'GET' && !id)
        return NextResponse.json({
          agreements: rows(
            'SELECT a.*,p.requester_id,p.recipient_id,p.requester_dog,p.recipient_dog FROM agreements a JOIN proposals p ON p.id=a.proposal_id WHERE p.requester_id=? OR p.recipient_id=? ORDER BY a.created_at DESC',
            u.id,
            u.id,
          ).map((a) => ({
            ...a,
            terms: JSON.parse(a.terms as string),
            puppies: rows(
              'SELECT * FROM puppies WHERE agreement_id=? ORDER BY created_at',
              a.id,
            ).map((p) => ({ ...JSON.parse(p.data as string), id: p.id, version: p.version })),
            events: rows(
              'SELECT * FROM events WHERE agreement_id=? ORDER BY created_at DESC',
              a.id,
            ),
          })),
        });
      if (id) {
        const a = agreementFor(id, u.id);
        if (method === 'GET' && action === 'export') {
          const p = proposalFor(a.proposal_id, u.id);
          return NextResponse.json(
            {
              agreement: row('SELECT * FROM agreements WHERE id=?', id),
              proposal: p,
              revisions: rows('SELECT * FROM revisions WHERE proposal_id=? ORDER BY version', p.id),
              events: rows('SELECT * FROM events WHERE agreement_id=?', id),
              puppies: rows('SELECT * FROM puppies WHERE agreement_id=?', id),
            },
            {
              headers: {
                'Content-Disposition': `attachment; filename="docloud-acuerdo-${id}.json"`,
              },
            },
          );
        }
        if (method === 'POST' && action === 'events') {
          requireUser(req, true);
          const b = z
            .object({
              kind: z.enum([
                'note',
                'vet',
                'meeting',
                'followup',
                'birth',
                'placement',
                'cancellation',
                'dispute',
              ]),
              note: z.string().trim().min(10).max(2000),
              dueAt: z.string().max(30).optional(),
              image: z.string().max(200).optional(),
            })
            .parse(await body(req));
          if (b.dueAt && Number.isNaN(Date.parse(b.dueAt)))
            throw new ApiError(400, 'Fecha inválida.');
          if (
            b.image &&
            !row(
              'SELECT id FROM uploads WHERE id=? AND user_id=? AND agreement_id=?',
              b.image.split('/').pop(),
              u.id,
              id,
            )
          )
            throw new ApiError(400, 'Evidencia inválida.');
          const eid = randomUUID();
          db().transaction(() => {
            run(
              'INSERT INTO events(id,agreement_id,author_id,kind,note,due_at,image) VALUES(?,?,?,?,?,?,?)',
              eid,
              id,
              u.id,
              b.kind,
              b.note,
              b.dueAt || null,
              b.image || null,
            );
            notify(
              a.requester_id === u.id ? a.recipient_id : a.requester_id,
              `${u.name} agregó un registro al seguimiento. Es una declaración del usuario, pendiente de corroboración.`,
            );
          })();
          return NextResponse.json({ ok: true });
        }
        if (method === 'POST' && action === 'puppies') {
          requireUser(req, true);
          const input = await body(req);
          const puppy = puppySchema.parse(input);
          if (puppy.bornAt > new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }))
            throw new ApiError(400, 'La fecha de nacimiento no puede estar en el futuro.');
          const puppyId = path[3];
          db().transaction(() => {
            if (puppyId) {
              const version = z.number().int().positive().parse(input.version);
              if (
                !run(
                  'UPDATE puppies SET data=?,version=version+1 WHERE id=? AND agreement_id=? AND version=?',
                  JSON.stringify(puppy),
                  puppyId,
                  id,
                  version,
                ).changes
              )
                throw new ApiError(
                  409,
                  'Este registro cambió o no pertenece al acuerdo. Actualiza antes de editar.',
                );
            } else {
              if (
                row<{ n: number }>('SELECT COUNT(*) n FROM puppies WHERE agreement_id=?', id)!.n >=
                30
              )
                throw new ApiError(400, 'Límite de registros de esta camada alcanzado.');
              run(
                'INSERT INTO puppies(id,agreement_id,data) VALUES(?,?,?)',
                randomUUID(),
                id,
                JSON.stringify(puppy),
              );
            }
            run(
              'INSERT INTO events(id,agreement_id,author_id,kind,note) VALUES(?,?,?,?,?)',
              randomUUID(),
              id,
              u.id,
              'note',
              `${u.name} ${puppyId ? 'actualizó' : 'registró'} a ${puppy.name} en el árbol. Estado declarado: ${puppy.status}.`,
            );
            notify(
              a.requester_id === u.id ? a.recipient_id : a.requester_id,
              `${u.name} agregó una actualización al árbol de la camada.`,
            );
          })();
          return NextResponse.json({ ok: true });
        }
        if (method === 'POST' && action === 'pay')
          throw new ApiError(
            503,
            'Los pagos no están habilitados. No se ha cobrado ni retenido dinero.',
          );
      }
    }
    if (resource === 'notifications') {
      const u = requireUser(req);
      if (method === 'GET')
        return NextResponse.json({
          notifications: rows(
            'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100',
            u.id,
          ),
        });
      if (method === 'POST') {
        run('UPDATE notifications SET read=1 WHERE user_id=?', u.id);
        return NextResponse.json({ ok: true });
      }
    }
    if (resource === 'upload' && method === 'POST') {
      const u = requireUser(req, true);
      if (!rateLimit(`upload:${u.id}`, 20, 3600000))
        throw new ApiError(429, 'Límite de imágenes alcanzado por esta hora.');
      const b = z
        .object({
          kind: z.enum(['pet', 'evidence']),
          agreementId: z.uuid().optional(),
          data: z.string().max(7100000),
        })
        .parse(await body(req));
      if (b.kind === 'evidence') {
        if (!b.agreementId) throw new ApiError(400, 'Selecciona el acuerdo.');
        agreementFor(b.agreementId, u.id);
      }
      const encoded = b.data.replace(/^data:image\/(jpeg|png|webp);base64,/, '');
      if (encoded === b.data) throw new ApiError(400, 'Usa una foto JPG, PNG o WebP.');
      const bytes = Buffer.from(encoded, 'base64');
      if (bytes.length > 5 * 1024 * 1024) throw new ApiError(413, 'La imagen supera 5 MB.');
      let output: Buffer;
      try {
        output = await sharp(bytes, { limitInputPixels: 20000000 })
          .rotate()
          .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new ApiError(400, 'La imagen no es válida o es demasiado grande.');
      }
      const fid = randomUUID();
      await mkdir(resolve(dataDir, 'uploads'), { recursive: true, mode: 0o700 });
      await writeFile(resolve(dataDir, 'uploads', `${fid}.webp`), output, { mode: 0o600 });
      run(
        'INSERT INTO uploads(id,user_id,kind,agreement_id) VALUES(?,?,?,?)',
        fid,
        u.id,
        b.kind,
        b.agreementId || null,
      );
      return NextResponse.json({ url: `/api/media/${fid}` });
    }
    if (resource === 'media' && method === 'GET' && id) {
      if (!z.uuid().safeParse(id).success) throw new ApiError(404, 'Imagen no encontrada.');
      const f = row<{ kind: string; agreement_id: string; user_id: string }>(
        'SELECT * FROM uploads WHERE id=?',
        id,
      );
      if (!f) throw new ApiError(404, 'Imagen no encontrada.');
      if (f.kind === 'evidence') agreementFor(f.agreement_id, requireUser(req).id);
      const image = await readFile(resolve(dataDir, 'uploads', `${id}.webp`));
      return new NextResponse(image, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': f.kind === 'pet' ? 'public, max-age=86400' : 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    if (resource === 'reports' && method === 'POST') {
      const u = requireUser(req);
      const b = z
        .object({ subject: z.string().min(2).max(200), reason: z.string().min(20).max(2000) })
        .parse(await body(req));
      run(
        'INSERT INTO reports(id,user_id,subject,reason) VALUES(?,?,?,?)',
        randomUUID(),
        u.id,
        b.subject,
        b.reason,
      );
      notify(u.id, 'Recibimos tu reporte. Está pendiente de revisión humana.');
      return NextResponse.json({ ok: true });
    }
    throw new ApiError(404, 'Recurso no encontrado.');
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: e.issues.map((i) => i.message).join(' ') },
        { status: 400 },
      );
    console.error('DOCLOUD API error', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json(
      { error: 'No pudimos completar la operación. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}
export { handler as GET, handler as POST, handler as DELETE };
