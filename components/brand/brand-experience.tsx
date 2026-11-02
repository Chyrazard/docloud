'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Heart,
  MessageCircle,
  Minus,
  Pause,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { helpTopics, type HelpTopic } from '@/lib/support';
import BrandLogo from './brand-logo';
import Toby, { type TobyAction } from './toby';
type Message = {
  id: number;
  from: 'visitor' | 'toby';
  text: string;
  href?: string;
  linkText?: string;
};
const greeting: Message = {
  id: 0,
  from: 'toby',
  text: '¡Guau, hola! Soy Toby 🐾 Te doy una pata para conocer DOCLOUD, registrar a tu peludo y entender cada paso.',
};
const INTRO_KEY = 'docloud-brand-intro-v1',
  MOTION_KEY = 'docloud-toby-paused',
  HIDDEN_KEY = 'docloud-toby-hidden';
export default function BrandExperience({ whatsappUrl }: { whatsappUrl: string | null }) {
  const pathname = usePathname();
  const [intro, setIntro] = useState(true),
    [open, setOpen] = useState(false),
    [hidden, setHidden] = useState(false),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false),
    [pageVisible, setPageVisible] = useState(true),
    [hint, setHint] = useState(false),
    [focusedForm, setFocusedForm] = useState(false),
    [action, setAction] = useState<TobyAction>('idle'),
    [messages, setMessages] = useState<Message[]>([greeting]);
  const launcher = useRef<HTMLButtonElement>(null),
    restoreButton = useRef<HTMLButtonElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    thread = useRef<HTMLDivElement>(null),
    pet = useRef<HTMLDivElement>(null),
    manualTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    manualUntil = useRef(0),
    nextMessage = useRef(1);
  const motionOff = paused || reduced;
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    try {
      setPaused(localStorage.getItem(MOTION_KEY) === 'yes');
      setHidden(localStorage.getItem(HIDDEN_KEY) === 'yes');
      if (sessionStorage.getItem(INTRO_KEY) || media.matches) setIntro(false);
      else sessionStorage.setItem(INTRO_KEY, 'yes');
    } catch {
      setIntro(false);
    }
    const introTimer = setTimeout(() => setIntro(false), 1250);
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    const focus = (e: FocusEvent) => {
      const node = e.target as HTMLElement | null;
      setFocusedForm(!!node?.matches('input,textarea,select') && !node.closest('.toby-assistant'));
    };
    document.addEventListener('focusin', focus);
    const blur = () => setFocusedForm(false);
    document.addEventListener('focusout', blur);
    return () => {
      media.removeEventListener('change', update);
      clearTimeout(introTimer);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', blur);
      if (manualTimer.current) clearTimeout(manualTimer.current);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.tobyMotion = motionOff ? 'off' : 'on';
  }, [motionOff]);
  useEffect(() => {
    if (hidden || motionOff || !pageVisible) {
      setAction('idle');
      return;
    }
    const steps: [TobyAction, number][] = [
      ['greet', 2300],
      ['idle', 13000],
      ['scratch', 2800],
      ['idle', 12000],
      ['lick', 2300],
      ['idle', 15000],
      ['happy', 2600],
      ['idle', 11000],
    ];
    let step = 0,
      timer: ReturnType<typeof setTimeout>;
    function tick() {
      if (Date.now() < manualUntil.current) {
        timer = setTimeout(tick, manualUntil.current - Date.now() + 30);
        return;
      }
      const [next, duration] = steps[step++ % steps.length];
      setAction(next);
      timer = setTimeout(tick, duration);
    }
    timer = setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, [hidden, motionOff, pageVisible]);
  useEffect(() => {
    if (hidden) return;
    let seen = false;
    try {
      seen = !!sessionStorage.getItem('docloud-toby-welcome');
    } catch {
      seen = true;
    }
    if (seen) return;
    const show = setTimeout(() => {
        setHint(true);
        try {
          sessionStorage.setItem('docloud-toby-welcome', 'yes');
        } catch {}
      }, 3200),
      hide = setTimeout(() => setHint(false), 10500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [hidden]);
  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open]);
  useEffect(() => {
    if (open && thread.current)
      thread.current.scrollTo({
        top: thread.current.scrollHeight,
        behavior: motionOff ? 'auto' : 'smooth',
      });
  }, [messages, open, motionOff]);
  useEffect(() => {
    setOpen(false);
    setHint(false);
  }, [pathname]);
  useEffect(() => {
    if (hidden || motionOff || !pageVisible || !window.matchMedia('(pointer:fine)').matches) return;
    let frame = 0,
      x = 0,
      y = 0;
    const look = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = pet.current?.getBoundingClientRect();
        if (!bounds || !pet.current) return;
        pet.current.style.setProperty(
          '--toby-look-x',
          `${Math.max(-2.3, Math.min(2.3, (x - bounds.left - bounds.width / 2) / 180))}px`,
        );
        pet.current.style.setProperty(
          '--toby-look-y',
          `${Math.max(-1.5, Math.min(1.5, (y - bounds.top - bounds.height / 3) / 200))}px`,
        );
      });
    };
    window.addEventListener('pointermove', look, { passive: true });
    return () => {
      window.removeEventListener('pointermove', look);
      cancelAnimationFrame(frame);
    };
  }, [hidden, motionOff, pageVisible]);
  function play(next: TobyAction) {
    if (manualTimer.current) clearTimeout(manualTimer.current);
    manualUntil.current = Date.now() + 3000;
    setAction(next);
    manualTimer.current = setTimeout(() => setAction('idle'), 3000);
  }
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  function hide() {
    setHidden(true);
    setOpen(false);
    setHint(false);
    try {
      localStorage.setItem(HIDDEN_KEY, 'yes');
    } catch {}
    requestAnimationFrame(() => restoreButton.current?.focus({ preventScroll: true }));
  }
  function restore() {
    setHidden(false);
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch {}
    requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true }));
  }
  function toggleMotion() {
    if (reduced) return;
    const next = !paused;
    setPaused(next);
    setAction('idle');
    try {
      localStorage.setItem(MOTION_KEY, next ? 'yes' : 'no');
    } catch {}
  }
  function ask(topic: HelpTopic) {
    const item = helpTopics[topic];
    setMessages((all) =>
      [
        ...all,
        { id: nextMessage.current++, from: 'visitor' as const, text: item.question },
        {
          id: nextMessage.current++,
          from: 'toby' as const,
          text: item.answer,
          href: item.href,
          linkText: item.linkText,
        },
      ].slice(-8),
    );
    play('happy');
  }
  return (
    <>
      {intro && (
        <div className="brand-intro" aria-hidden="true">
          <div className="brand-intro-glow" />
          <div className="brand-intro-content">
            <div className="brand intro-brand">
              <BrandLogo />
            </div>
            <div className="brand-paw-track">
              <span />
              <span />
              <span />
            </div>
            <p>Buenas historias están por comenzar.</p>
          </div>
        </div>
      )}
      {hidden ? (
        <button
          ref={restoreButton}
          className="toby-restore"
          onClick={restore}
          aria-label="Volver a mostrar a Toby"
        >
          <Toby face />
          <span>Toby</span>
          <ChevronDown size={12} />
        </button>
      ) : (
        <div
          className={`toby-assistant ${motionOff ? 'toby-motion-off' : ''} ${open ? 'toby-panel-open' : ''} ${focusedForm ? 'toby-form-focused' : ''}`}
        >
          {open && (
            <section
              className="toby-panel"
              role="dialog"
              aria-modal="false"
              aria-labelledby="toby-panel-title"
            >
              <header className="toby-panel-header">
                <span className="toby-panel-avatar">
                  <Toby face action="happy" />
                </span>
                <div>
                  <h2 id="toby-panel-title" ref={heading} tabIndex={-1}>
                    Toby <span>de DOCLOUD</span>
                  </h2>
                  <p>
                    <Sparkles size={10} /> Tu guía, paso a paso
                  </p>
                </div>
                <div className="toby-panel-tools">
                  <button
                    onClick={toggleMotion}
                    disabled={reduced}
                    aria-label={
                      reduced
                        ? 'Tu dispositivo solicita movimiento reducido'
                        : paused
                          ? 'Reanudar animación de Toby'
                          : 'Pausar animación de Toby'
                    }
                    title={
                      reduced
                        ? 'Movimiento reducido'
                        : paused
                          ? 'Reanudar animaciones'
                          : 'Pausar animaciones'
                    }
                  >
                    {motionOff ? <Play size={15} /> : <Pause size={15} />}
                  </button>
                  <button onClick={close} aria-label="Cerrar ayuda de Toby">
                    <X size={18} />
                  </button>
                </div>
              </header>
              <div
                className="toby-thread"
                ref={thread}
                aria-live="polite"
                aria-relevant="additions"
              >
                <div className="toby-thread-label">
                  <span /> UNA PATA PARA EMPEZAR <span />
                </div>
                {messages.map((message) => (
                  <div key={message.id} className={`toby-message toby-message-${message.from}`}>
                    {message.from === 'toby' && (
                      <span className="toby-message-mark">
                        <Toby face />
                      </span>
                    )}
                    <div>
                      <p>{message.text}</p>
                      {message.href && (
                        <Link
                          href={message.href}
                          target={message.href.includes('/privacidad') ? '_blank' : undefined}
                          rel={
                            message.href.includes('/privacidad') ? 'noopener noreferrer' : undefined
                          }
                          onClick={close}
                        >
                          {message.linkText}
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="toby-questions">
                <span>¿Por dónde empezamos?</span>
                <div>
                  {(Object.keys(helpTopics) as HelpTopic[]).map((topic) => (
                    <button key={topic} onClick={() => ask(topic)}>
                      {helpTopics[topic].question}
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="toby-contact">
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon /> Continuar por WhatsApp <ArrowRight size={14} />
                  </a>
                ) : (
                  <>
                    <button disabled>
                      <WhatsAppIcon /> WhatsApp con IA · próximamente
                    </button>
                    <p>Por ahora, te ayudo con estas respuestas rápidas.</p>
                  </>
                )}
              </div>
              <footer className="toby-panel-footer">
                <span>Respuestas preparadas · sin chat con IA activo</span>
                <div>
                  <button
                    onClick={() => play('greet')}
                    aria-label="Que Toby salude"
                    title="Saludar"
                  >
                    <Sparkles size={14} />
                  </button>
                  <button
                    onClick={() => play('scratch')}
                    aria-label="Que Toby se rasque"
                    title="Rascarse"
                  >
                    <span>🐾</span>
                  </button>
                  <button
                    onClick={() => play('lick')}
                    aria-label="Que Toby se lama"
                    title="Darle un mimo"
                  >
                    <Heart size={14} />
                  </button>
                </div>
              </footer>
            </section>
          )}
          <div className="toby-companion" ref={pet}>
            <div className="toby-companion-halo" />
            <div className={`toby-invite ${hint && !open ? 'toby-invite-visible' : ''}`}>
              <button
                className="toby-invite-copy"
                onClick={() => {
                  setOpen(true);
                  setHint(false);
                  play('greet');
                }}
              >
                <span>¡Guau, hola!</span>
                <b>
                  ¿Te doy una pata? <Heart size={11} />
                </b>
              </button>
              <button
                className="toby-invite-close"
                aria-label="Cerrar saludo de Toby"
                onClick={() => setHint(false)}
              >
                <X size={11} />
              </button>
            </div>
            <button
              className="toby-hide"
              aria-label="Ocultar a Toby"
              title="Ocultar a Toby"
              onClick={hide}
            >
              <Minus size={13} />
            </button>
            <button
              ref={launcher}
              className="toby-launcher"
              aria-label={open ? 'Cerrar a Toby, guía de DOCLOUD' : 'Abrir a Toby, guía de DOCLOUD'}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => {
                setOpen(!open);
                setHint(false);
                if (!open) play('greet');
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse' && !motionOff) play('happy');
              }}
            >
              <Toby action={action} />
              <span className="toby-launcher-badge">
                {open ? <X size={18} /> : <MessageCircle size={19} />}
              </span>
              <span className="toby-launcher-caption">
                {open ? 'Hasta la próxima patita' : 'Tu amigo en DOCLOUD'}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.8 11.8a8.7 8.7 0 0 1-13 7.6L3 20.8l1.4-4.6a8.7 8.7 0 1 1 16.4-4.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 7.3c-.7 0-1.1.6-1.1 1.4 0 2.6 3.5 6.3 6.4 6.6.8.1 1.7-.8 1.8-1.4.1-.5-1.8-1.5-2.1-1.2l-.8.8c-1.6-.7-2.7-1.8-3.3-3.2l.7-.8c.4-.4-.7-2.2-1.1-2.2h-.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
