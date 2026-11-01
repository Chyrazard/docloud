'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Heart,
  ImagePlus,
  LockKeyhole,
  PawPrint,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { INTAKE_CONSENT, intakeSchema } from '@/lib/intake';
const preferenceLabels = { money: 'Por dinero', puppies: 'Por crías', both: 'Ambas opciones' };
export default function JoinForm() {
  const [preference, setPreference] = useState<keyof typeof preferenceLabels>('both'),
    [preview, setPreview] = useState(''),
    [photo, setPhoto] = useState(''),
    [photoBusy, setPhotoBusy] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState<{ dog: string; preference: string } | null>(null);
  const id = useRef(''),
    submitted = useRef(false),
    photoVersion = useRef(0),
    result = useRef<HTMLDivElement>(null);
  useEffect(() => {
    id.current = crypto.randomUUID();
    return () => {
      photoVersion.current++;
    };
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    if (done) {
      result.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [done]);
  async function choosePhoto(file?: File) {
    if (!file) return;
    const version = ++photoVersion.current;
    setError('');
    setPhoto('');
    setPreview('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Elige una foto JPG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La foto debe pesar máximo 5 MB.');
      return;
    }
    setPhotoBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('No pudimos leer la foto.'));
        reader.readAsDataURL(file);
      });
      if (version === photoVersion.current) {
        setPhoto(data);
        setPreview(URL.createObjectURL(file));
      }
    } catch {
      if (version === photoVersion.current) setError('No pudimos leer la foto. Intenta con otra.');
    } finally {
      if (version === photoVersion.current) setPhotoBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitted.current || busy) return;
    setError('');
    if (!photo) {
      setError('Agrega una foto de tu perro antes de enviar.');
      return;
    }
    const f = new FormData(e.currentTarget),
      params = new URLSearchParams(window.location.search);
    const parsed = intakeSchema.safeParse({
      submissionId: id.current,
      name: f.get('name'),
      email: f.get('email'),
      phone: f.get('phone'),
      dogName: f.get('dogName'),
      breed: f.get('breed'),
      age: Number(f.get('age')),
      preference,
      photo,
      consent: f.get('consent') === 'on',
      website: f.get('website') || '',
      source: params.get('utm_source') || params.get('ref') || 'direct',
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    submitted.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'No pudimos guardar el registro. Intenta de nuevo.');
      setDone({ dog: parsed.data.dogName, preference: preferenceLabels[preference] });
      setPhoto('');
      setPreview('');
    } catch (err) {
      submitted.current = false;
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="join-page">
      <header className="join-nav">
        <Link href="/" className="brand" aria-label="DOCLOUD, inicio">
          <span className="brand-mark">
            <PawPrint size={23} fill="currentColor" />
          </span>
          <span>
            do<span className="brand-light">cloud</span>
            <i />
          </span>
        </Link>
        <Link href="/" className="join-back">
          Explorar DOCLOUD <ArrowUpRightIcon />
        </Link>
      </header>
      <main className="join-main">
        {done ? (
          <section
            className="join-success"
            ref={result}
            tabIndex={-1}
            aria-labelledby="join-success-title"
          >
            <span className="join-success-icon">
              <CheckCircle2 size={36} />
            </span>
            <span className="join-eyebrow">UN BUEN COMIENZO</span>
            <h1 id="join-success-title">
              La historia de {done.dog}
              <br />
              ya tiene un comienzo<span>.</span>
            </h1>
            <p>Guardamos sus datos y su foto en un preperfil privado.</p>
            <div className="join-receipt">
              <PawPrint size={22} />
              <div>
                <b>{done.dog}</b>
                <span>{done.preference} · Pendiente de completar</span>
              </div>
              <span className="join-status">
                <LockKeyhole size={12} /> Privado
              </span>
            </div>
            <div className="join-next">
              <h2>¿Qué sigue?</h2>
              <p>
                El equipo de DOCLOUD podrá contactarte por correo o WhatsApp para completar el
                perfil y confirmar contigo la publicación. Todavía no se ha creado una cuenta de
                acceso.
              </p>
              <p>No se realizó ningún cobro ni se enviaron mensajes automáticos.</p>
            </div>
            <Link className="btn btn-primary" href="/">
              Conocer DOCLOUD <ArrowRight size={16} />
            </Link>
            <button
              className="join-another"
              onClick={() => {
                id.current = crypto.randomUUID();
                submitted.current = false;
                setDone(null);
                setError('');
              }}
            >
              Registrar otro peludo
            </button>
            <Link
              className="join-privacy-link"
              href="/unete/privacidad"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar, corregir o eliminar mis datos
            </Link>
          </section>
        ) : (
          <>
            <section className="join-story">
              <span className="join-pill">
                <Sparkles size={13} /> UNA COMUNIDAD QUE APENAS COMIENZA
              </span>
              <h1>
                Su próxima historia
                <br />
                empieza contigo<span>.</span>
              </h1>
              <p>
                Conecta con personas que también consideran un cruce para su perro y quieren hacerlo
                con acuerdos claros y compromiso.
              </p>
              <div className="join-story-photo">
                <img
                  src="/images/toby-jack.jpg"
                  alt="Jack Russell Terrier al aire libre"
                  fetchPriority="high"
                />
                <div className="join-photo-card">
                  <span>
                    <Heart size={19} />
                  </span>
                  <div>
                    Buenos encuentros.<small>Mejores historias.</small>
                  </div>
                </div>
                <span className="join-photo-paw">
                  <PawPrint size={30} fill="currentColor" />
                </span>
              </div>
              <div className="join-promises">
                <span>
                  <Check size={14} /> Sin costo
                </span>
                <span>
                  <Check size={14} /> Sin contraseña
                </span>
                <span>
                  <Check size={14} /> A tu ritmo
                </span>
              </div>
              <div className="join-story-note">
                <ShieldCheck size={21} />
                <p>
                  Un primer paso para conocerse.
                  <br />
                  <b>El bienestar siempre va primero.</b>
                </p>
              </div>
            </section>
            <section className="join-form-panel">
              <div className="join-form-heading">
                <span className="join-eyebrow">HAGAMOS LAS PRESENTACIONES</span>
                <h2>
                  Cuéntanos de ustedes <PawPrint size={21} />
                </h2>
                <p>Lo esencial para preparar el perfil de tu compañero.</p>
              </div>
              <div className="join-data-notice">
                <LockKeyhole size={17} />
                <p>
                  Guardaremos tus datos de contacto y la información y foto de tu perro para
                  preparar un <b>preperfil privado</b> y contactarte para completar el registro. La
                  publicación se confirma después contigo.{' '}
                  <Link href="/unete/privacidad" target="_blank" rel="noopener noreferrer">
                    Cómo usamos tus datos
                  </Link>
                </p>
              </div>
              <form
                onSubmit={submit}
                className="join-form"
                aria-label="Registro rápido de tu peludo"
              >
                <fieldset disabled={busy}>
                  <legend>
                    <span>01</span> Sobre ti
                  </legend>
                  <div className="join-grid">
                    <label className="field">
                      <span>Tu nombre</span>
                      <input
                        name="name"
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={70}
                        placeholder="¿Cómo te llamas?"
                      />
                    </label>
                    <label className="field">
                      <span>Celular / WhatsApp</span>
                      <input
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        maxLength={35}
                        placeholder="+57 300 123 4567"
                      />
                      <small>Si es colombiano, basta con los 10 dígitos.</small>
                    </label>
                    <label className="field join-full">
                      <span>Correo electrónico</span>
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        placeholder="tu@correo.com"
                      />
                    </label>
                  </div>
                </fieldset>
                <fieldset disabled={busy}>
                  <legend>
                    <span>02</span> Tu peludo, el protagonista
                  </legend>
                  <label className={`join-photo-upload ${preview ? 'with-photo' : ''}`}>
                    <input
                      aria-label="Foto de tu perro"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy || photoBusy}
                      onChange={(e) => choosePhoto(e.target.files?.[0])}
                    />
                    {preview ? (
                      <>
                        <img src={preview} alt="Vista previa de la foto de tu perro" />
                        <div>
                          <b>¡Esa es su mejor cara!</b>
                          <span>
                            Cambiar foto <Camera size={13} />
                          </span>
                        </div>
                        <CheckCircle2 size={21} />
                      </>
                    ) : (
                      <>
                        <span className="join-camera">
                          <ImagePlus size={23} />
                        </span>
                        <div>
                          <b>{photoBusy ? 'Preparando su foto…' : 'Agrega una foto de tu perro'}</b>
                          <small>JPG, PNG o WebP · hasta 5 MB</small>
                        </div>
                        <PlusIcon />
                      </>
                    )}
                  </label>
                  <div className="join-grid">
                    <label className="field">
                      <span>Su nombre</span>
                      <input
                        name="dogName"
                        required
                        maxLength={40}
                        placeholder="Por ejemplo, Toby"
                      />
                    </label>
                    <label className="field">
                      <span>Edad (años)</span>
                      <input
                        name="age"
                        type="number"
                        inputMode="decimal"
                        required
                        min={0}
                        max={30}
                        step={0.1}
                        placeholder="3"
                      />
                      <small>Por ejemplo: 0,5 para seis meses.</small>
                    </label>
                    <label className="field join-full">
                      <span>Raza</span>
                      <input
                        name="breed"
                        required
                        minLength={2}
                        maxLength={70}
                        placeholder="Jack Russell Terrier, Golden, mestizo…"
                      />
                    </label>
                  </div>
                </fieldset>
                <fieldset disabled={busy}>
                  <legend>
                    <span>03</span> ¿Qué tipo de acuerdo te interesa?
                  </legend>
                  <div className="join-preferences" role="radiogroup" aria-label="Tipo de acuerdo">
                    <label className={preference === 'money' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="preference"
                        value="money"
                        checked={preference === 'money'}
                        onChange={() => setPreference('money')}
                      />
                      <span>Por dinero</span>
                      <small>Pagar o cobrar</small>
                    </label>
                    <label className={preference === 'puppies' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="preference"
                        value="puppies"
                        checked={preference === 'puppies'}
                        onChange={() => setPreference('puppies')}
                      />
                      <span>Por crías</span>
                      <small>Acordar un reparto</small>
                    </label>
                    <label className={preference === 'both' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="preference"
                        value="both"
                        checked={preference === 'both'}
                        onChange={() => setPreference('both')}
                      />
                      <span>Ambas opciones</span>
                      <small>Estoy abierto a conversar</small>
                    </label>
                  </div>
                </fieldset>
                <div className="join-honeypot" aria-hidden="true">
                  <label>
                    Tu sitio web
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <label className="join-consent">
                  <input name="consent" required type="checkbox" disabled={busy} />
                  <span>{INTAKE_CONSENT}</span>
                </label>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="btn btn-primary join-submit"
                  disabled={busy || photoBusy}
                  type="submit"
                >
                  {busy ? 'Guardando su comienzo…' : 'Crear su preperfil'}
                  <ArrowRight size={18} />
                </button>
                <p className="join-submit-note">
                  <LockKeyhole size={12} /> Sin pagos ni publicación automática. Tú decides el
                  siguiente paso.
                </p>
              </form>
            </section>
          </>
        )}
      </main>
      <footer className="join-footer">
        <span>
          <PawPrint size={13} /> DOCLOUD · Buenos encuentros, mejores historias.
        </span>
        <Link href="/unete/privacidad" target="_blank" rel="noopener noreferrer">
          Privacidad y tus datos
        </Link>
      </footer>
    </div>
  );
}
function ArrowUpRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
