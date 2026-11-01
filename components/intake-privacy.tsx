'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, PawPrint } from 'lucide-react';
export default function IntakePrivacy() {
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState('');
  return (
    <div className="join-page">
      <header className="join-nav">
        <Link href="/unete" className="brand">
          <span className="brand-mark">
            <PawPrint size={22} fill="currentColor" />
          </span>
          <span>
            do<span className="brand-light">cloud</span>
            <i />
          </span>
        </Link>
        <Link href="/unete" className="join-back">
          <ArrowLeft size={14} /> Volver al formulario
        </Link>
      </header>
      <main className="join-main join-privacy-main">
        <span className="join-eyebrow">TUS DATOS, CON CLARIDAD</span>
        <h1>Antes de comenzar</h1>
        <article>
          <p>
            Este aviso corresponde al formulario de captación de DOCLOUD, una plataforma en etapa
            piloto. Versión del 1 de noviembre de 2026.
          </p>
          <h2>Qué información guardamos</h2>
          <p>
            Tu nombre, correo y celular; el nombre, foto, raza, edad y preferencia de acuerdo de tu
            perro. Conservamos la fecha, el texto de tu autorización y, cuando llega en el enlace,
            el canal de la campaña. La fotografía se convierte a WebP y se eliminan sus metadatos
            originales.
          </p>
          <h2>Para qué la usamos</h2>
          <p>
            Preparar un preperfil privado y permitir que el equipo de DOCLOUD te contacte por correo
            o WhatsApp para completar el registro. Este paso no crea una cuenta de acceso, no activa
            pagos ni confirma la aptitud reproductiva de tu mascota.
          </p>
          <h2>Qué se publica</h2>
          <p>
            El envío no publica tu teléfono, correo ni la foto de tu perro en el catálogo. El
            preperfil queda pendiente de revisión y de confirmar contigo su publicación. No estamos
            recopilando cédulas ni reconocimiento facial en este formulario.
          </p>
          <h2>Quién puede acceder</h2>
          <p>
            El equipo autorizado que opera DOCLOUD puede consultar la información para atender el
            registro y tus solicitudes. Los datos de contacto se guardan cifrados y la foto no tiene
            un enlace público. El alojamiento utiliza el servidor de DOCLOUD y Cloudflare para
            servir y proteger el sitio.
          </p>
          <h2>Conservación y decisiones pendientes</h2>
          <p>
            Los registros se conservan mientras se gestiona la solicitud de registro o hasta atender
            una solicitud válida de eliminación. Las copias de respaldo rotan conservando las siete
            más recientes; no desaparecen de inmediato al retirar un registro activo. La política
            definitiva, la identificación completa del operador y los plazos de retención deberán
            formalizarse antes del lanzamiento comercial.
          </p>
          <h2>Consultar, corregir o eliminar</h2>
          <p>
            Puedes dejar una solicitud aquí. El equipo la revisará manualmente y comprobará que eres
            el titular antes de entregar o modificar información. Enviar la solicitud no elimina
            datos automáticamente. Este formulario no ofrece atención inmediata ni envía correos de
            confirmación automáticos.
          </p>
          <div id="solicitud">
            {sent ? (
              <div className="success-box" role="status">
                <CheckCircle2 size={22} />
                <div>
                  <b>Tu solicitud quedó registrada.</b>
                  <p>
                    Está pendiente de revisión humana. No se ha modificado ni eliminado información.
                  </p>
                </div>
              </div>
            ) : (
              <form
                aria-label="Solicitud sobre mis datos"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy) return;
                  setBusy(true);
                  setError('');
                  const f = new FormData(e.currentTarget);
                  try {
                    const res = await fetch('/api/intake/privacy-request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: f.get('name'),
                        email: f.get('email'),
                        action: f.get('action'),
                        message: f.get('message'),
                        website: f.get('website') || '',
                        consent: f.get('consent') === 'on',
                      }),
                    });
                    const result = await res.json();
                    if (!res.ok)
                      throw new Error(result.error || 'No pudimos registrar la solicitud.');
                    setSent(true);
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : 'Revisa tu conexión e intenta de nuevo.',
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="field">
                  <span>Tu nombre</span>
                  <input name="name" autoComplete="name" required minLength={2} maxLength={70} />
                </label>
                <label className="field">
                  <span>Correo que usaste en el registro</span>
                  <input name="email" type="email" autoComplete="email" required maxLength={254} />
                </label>
                <label className="field">
                  <span>¿Qué necesitas?</span>
                  <select name="action">
                    <option value="access">Consultar mis datos</option>
                    <option value="correct">Corregir mis datos</option>
                    <option value="delete">Solicitar su eliminación</option>
                  </select>
                </label>
                <label className="field">
                  <span>Detalles de tu solicitud</span>
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={1500}
                    rows={4}
                    placeholder="Cuéntanos lo necesario para encontrar tu registro. No envíes documentos de identidad."
                  />
                </label>
                <div className="join-honeypot" aria-hidden="true">
                  <input aria-label="Sitio web" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <label className="join-consent">
                  <input type="checkbox" name="consent" required />
                  <span>
                    Autorizo el uso de estos datos para recibir y atender esta solicitud y verificar
                    su titularidad.
                  </span>
                </label>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn btn-primary" disabled={busy} type="submit">
                  {busy ? 'Guardando…' : 'Registrar solicitud'}
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </article>
      </main>
      <footer className="join-footer">
        <span>
          <LockKeyhole size={12} /> Tus datos no aparecen en un directorio público.
        </span>
        <Link href="/unete">Volver al registro</Link>
      </footer>
    </div>
  );
}
