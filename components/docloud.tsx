'use client';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Compass,
  Download,
  FileCheck2,
  FileText,
  Flag,
  Heart,
  HelpCircle,
  House,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PawPrint,
  Plus,
  Search,
  Send,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
  CalendarDays,
  Clock,
  Wallet,
  Eye,
  EyeOff,
  Info,
  Camera,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import FamilyTree from './family-tree';
import type { Puppy } from '@/lib/domain';
import { demoDogs } from '@/lib/demo';
import { defaultTerms, type Dog, type Terms } from '@/lib/domain';
type User = {
  id: string;
  name: string;
  email: string;
  city: string;
  mfaEnabled: boolean;
  identityStatus: string;
};
type Revision = { version: number; author_id: string; terms: Terms; created_at: string };
type Proposal = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_dog: string;
  recipient_dog: string;
  status: string;
  version: number;
  last_by: string;
  created_at: string;
  revisions: Revision[];
};
type Event = {
  id: string;
  kind: string;
  note: string;
  created_at: string;
  due_at?: string;
  image?: string;
  author_id: string;
};
type Agreement = {
  id: string;
  proposal_id: string;
  requester_id: string;
  recipient_id: string;
  requester_dog: string;
  recipient_dog: string;
  terms: Terms;
  terms_hash: string;
  status: string;
  payment_status: string;
  created_at: string;
  events: Event[];
  puppies?: Puppy[];
};
type Notice = { id: string; message: string; read: number; created_at: string };
type View =
  | 'discover'
  | 'dashboard'
  | 'pets'
  | 'proposals'
  | 'agreements'
  | 'favorites'
  | 'security'
  | 'help';
type Modal =
  | { type: 'auth'; register?: boolean }
  | { type: 'pet' }
  | { type: 'dog'; dog: Dog }
  | { type: 'offer'; dog?: Dog; proposal?: Proposal }
  | { type: 'report'; subject: string }
  | { type: 'legal'; page: 'privacy' | 'terms' }
  | null;
const money = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
const date = (s: string) =>
  new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const labels: Record<View, string> = {
  discover: 'Explorar',
  dashboard: 'Mi dashboard',
  pets: 'Mis peludos',
  proposals: 'Propuestas',
  agreements: 'Acuerdos y seguimiento',
  favorites: 'Favoritos',
  security: 'Confianza y seguridad',
  help: 'Centro de ayuda',
};
const statusLabel: Record<string, string> = {
  pending: 'En conversación',
  accepted: 'Acuerdo alcanzado',
  declined: 'No aceptada',
  cancelled: 'Cancelada',
};
const eventLabels: Record<string, string> = {
  note: 'Nota',
  vet: 'Valoración veterinaria',
  meeting: 'Encuentro reportado',
  followup: 'Seguimiento',
  birth: 'Nacimiento reportado',
  placement: 'Hogar de una cría',
  cancellation: 'Solicitud de cancelación',
  dispute: 'Incidencia',
};
async function api<T = Record<string, unknown>>(
  path: string,
  method = 'GET',
  data?: unknown,
): Promise<T> {
  const r = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'No pudimos completar esta acción.');
  return j;
}
function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}) {
  return (
    <button {...props} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}
function Empty({
  icon: Icon = PawPrint,
  title,
  children,
  action,
}: {
  icon?: typeof PawPrint;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={30} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function TermsSummary({
  terms,
  requester = 'quien solicita',
  recipient = 'quien recibe',
}: {
  terms: Terms;
  requester?: string;
  recipient?: string;
}) {
  return (
    <div className="terms-summary">
      <div className="terms-main">
        <span className="round-icon">
          {terms.mode === 'money' ? <Wallet size={21} /> : <PawPrint size={21} />}
        </span>
        <div>
          <small>{terms.mode === 'money' ? 'Acuerdo económico' : 'Distribución de crías'}</small>
          <strong>
            {terms.mode === 'money' ? money(terms.amount) + ' COP' : 'Reglas por tamaño de camada'}
          </strong>
          {terms.mode === 'money' && (
            <p>
              {terms.payer === 'requester' ? requester : recipient} →{' '}
              {terms.payer === 'requester' ? recipient : requester}.
            </p>
          )}
        </div>
      </div>
      {terms.mode === 'puppies' && (
        <div className="rule-table">
          <div>
            <b>Crías nacidas</b>
            <b>Para {requester}</b>
            <b>Para {recipient}</b>
          </div>
          {terms.rules.map((r, i) => (
            <div key={i}>
              <span>{r.min === r.max ? r.min : `${r.min}–${r.max}`}</span>
              <span>{r.requester}</span>
              <span>{r.min === r.max ? r.min - r.requester : `Total menos ${r.requester}`}</span>
            </div>
          ))}
        </div>
      )}
      <details>
        <summary>
          Condiciones y bienestar <ChevronDown size={15} />
        </summary>
        <h4>Si alguien cancela</h4>
        <p>{terms.cancellation}</p>
        <h4>Si no hay gestación</h4>
        <p>{terms.unsuccessful}</p>
        <h4>Cuidados y gastos</h4>
        <p>{terms.expenses}</p>
        {terms.notes && (
          <>
            <h4>Condiciones adicionales</h4>
            <p>{terms.notes}</p>
          </>
        )}
        <p>
          El bienestar de las mascotas tiene prioridad. Este acuerdo no sustituye una valoración
          veterinaria ni garantiza un resultado.
        </p>
      </details>
    </div>
  );
}
export default function Docloud() {
  const [view, setView] = useState<View>('discover'),
    [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [dogs, setDogs] = useState<Dog[]>(demoDogs),
    [proposals, setProposals] = useState<Proposal[]>([]),
    [agreements, setAgreements] = useState<Agreement[]>([]),
    [favorites, setFavorites] = useState<string[]>([]),
    [notices, setNotices] = useState<Notice[]>([]);
  const [modal, setModal] = useState<Modal>(null),
    [toast, setToast] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [noticeOpen, setNoticeOpen] = useState(false);
  const [query, setQuery] = useState(''),
    [city, setCity] = useState(''),
    [breed, setBreed] = useState(''),
    [sex, setSex] = useState(''),
    [mode, setMode] = useState(''),
    [showExamples, setShowExamples] = useState(true);
  const [demo, setDemo] = useState(false),
    [demoRole, setDemoRole] = useState('demo-ana'),
    [demoProposals, setDemoProposals] = useState<Proposal[]>([]),
    [demoAgreements, setDemoAgreements] = useState<Agreement[]>([]),
    [demoFavorites, setDemoFavorites] = useState<string[]>([]),
    [selectedProposal, setSelectedProposal] = useState<string | null>(null),
    [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = (s: string) => {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 6000);
  };
  const navigate = (v: View) => {
    setView(v);
    setMobile(false);
    setNoticeOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  async function refresh() {
    try {
      const d = await api<{ dogs: Dog[] }>('dogs');
      setDogs(d.dogs);
      const me = await api<{ user: User | null }>('auth/me');
      setUser(me.user);
      if (me.user) {
        const [p, a, f, n] = await Promise.all([
          api<{ proposals: Proposal[] }>('proposals'),
          api<{ agreements: Agreement[] }>('agreements'),
          api<{ ids: string[] }>('favorites'),
          api<{ notifications: Notice[] }>('notifications'),
        ]);
        setProposals(p.proposals);
        setAgreements(a.agreements);
        setFavorites(f.ids);
        setNotices(n.notifications);
      } else {
        setProposals([]);
        setAgreements([]);
        setFavorites([]);
        setNotices([]);
      }
    } catch (e) {
      say((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    try {
      const d = JSON.parse(localStorage.getItem('docloud-demo-v1') || 'null');
      if (d) {
        setDemoProposals(d.proposals || []);
        setDemoAgreements(d.agreements || []);
        setDemoFavorites(d.favorites || []);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (!demo) return;
    localStorage.setItem(
      'docloud-demo-v1',
      JSON.stringify({
        proposals: demoProposals,
        agreements: demoAgreements,
        favorites: demoFavorites,
      }),
    );
  }, [demo, demoProposals, demoAgreements, demoFavorites]);
  useEffect(() => {
    if (!user || demo) return;
    const timer = setInterval(() => {
      refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, [user, demo]);
  const activeUser = demo
    ? {
        id: demoRole,
        name: demoRole === 'demo-ana' ? 'Ana' : 'Nicolás',
        email: '',
        city: 'Bogotá',
        mfaEnabled: true,
        identityStatus: 'demo',
      }
    : user;
  const allProposals = demo ? demoProposals : proposals,
    allAgreements = demo ? demoAgreements : agreements,
    allFavorites = demo ? demoFavorites : favorites;
  const myDogs = dogs.filter((d) =>
    demo ? d.ownerId === demoRole : !d.demo && d.ownerId === user?.id,
  );
  const myProposals = allProposals.filter((p) =>
    [p.requester_id, p.recipient_id].includes(activeUser?.id || ''),
  );
  const myAgreements = allAgreements.filter((a) =>
    [a.requester_id, a.recipient_id].includes(activeUser?.id || ''),
  );
  const pending = myProposals.filter(
    (p) => p.status === 'pending' && p.last_by !== activeUser?.id,
  ).length;
  const findDog = (id: string) => dogs.find((d) => d.id === id) || demoDogs[0];
  function startDemo(target?: Dog) {
    setDemo(true);
    setDemoRole('demo-ana');
    if (!demoProposals.length) {
      const now = new Date().toISOString();
      setDemoProposals([
        {
          id: 'demo-proposal-1',
          requester_id: 'demo-you',
          recipient_id: 'demo-ana',
          requester_dog: 'demo-toby',
          recipient_dog: 'demo-luna',
          status: 'pending',
          version: 1,
          last_by: 'demo-you',
          created_at: now,
          revisions: [
            {
              version: 1,
              author_id: 'demo-you',
              terms: { ...defaultTerms, payer: 'recipient', amount: 350000 },
              created_at: now,
            },
          ],
        },
      ]);
    }
    setModal(null);
    navigate('proposals');
    say('Demo activa: estás respondiendo como Ana, responsable de Luna.');
  }
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      return true;
    } catch (e) {
      setError((e as Error).message);
      say((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function needAccount() {
    if (!user) {
      setModal({ type: 'auth', register: true });
      return false;
    }
    if (!user.mfaEnabled) {
      navigate('security');
      say('Primero activa tu autenticación en dos pasos.');
      return false;
    }
    return true;
  }
  async function favorite(dog: Dog) {
    if (dog.demo || demo) {
      setDemoFavorites((a) =>
        a.includes(dog.id) ? a.filter((id) => id !== dog.id) : [...a, dog.id],
      );
      if (!demo) say('Ejemplo guardado para la demo.');
      return;
    }
    if (!user) {
      setModal({ type: 'auth' });
      return;
    }
    await perform(async () => {
      await api('favorites', 'POST', { dogId: dog.id });
      await refresh();
    });
  }
  async function respond(p: Proposal, action: string) {
    await perform(async () => {
      if (demo) {
        if (p.status !== 'pending' || (p.last_by === demoRole && action !== 'cancel'))
          throw new Error('Cambia al otro participante para responder.');
        setDemoProposals((a) =>
          a.map((x) =>
            x.id === p.id
              ? {
                  ...x,
                  status:
                    action === 'accept'
                      ? 'accepted'
                      : action === 'decline'
                        ? 'declined'
                        : 'cancelled',
                }
              : x,
          ),
        );
        if (action === 'accept') {
          const a: Agreement = {
            id: 'demo-agreement-' + Date.now(),
            proposal_id: p.id,
            requester_id: p.requester_id,
            recipient_id: p.recipient_id,
            requester_dog: p.requester_dog,
            recipient_dog: p.recipient_dog,
            terms: p.revisions.at(-1)!.terms,
            terms_hash: 'Demostración local · no es un contrato real',
            status: 'awaiting_verification',
            payment_status: 'unavailable',
            created_at: new Date().toISOString(),
            events: [],
          };
          setDemoAgreements((x) => [a, ...x]);
          navigate('agreements');
        }
        say(
          action === 'accept'
            ? '¡Acuerdo de ejemplo creado! Ahora puedes probar el seguimiento.'
            : 'Respuesta guardada en la demo.',
        );
      } else {
        await api(`proposals/${p.id}/${action}`, 'POST', { version: p.version });
        await refresh();
        if (action === 'accept') navigate('agreements');
        say('Respuesta guardada.');
      }
    });
  }
  const filtered = dogs.filter(
    (d) =>
      (showExamples || !d.demo) &&
      (!query || `${d.name} ${d.breed} ${d.city}`.toLowerCase().includes(query.toLowerCase())) &&
      (!city || d.city === city) &&
      (!breed || d.breed === breed) &&
      (!sex || d.sex === sex) &&
      (!mode || d.mode === mode),
  );
  const nav = [
    { view: 'dashboard' as View, icon: LayoutDashboard },
    { view: 'discover' as View, icon: Compass },
    { view: 'pets' as View, icon: PawPrint },
    { view: 'proposals' as View, icon: ArrowLeftRight },
    { view: 'agreements' as View, icon: FileCheck2 },
    { view: 'favorites' as View, icon: Heart },
  ];
  function DogCard({ dog }: { dog: Dog }) {
    return (
      <article className="dog-card">
        <button
          className="dog-image"
          onClick={() => setModal({ type: 'dog', dog })}
          aria-label={`Ver perfil de ${dog.name}`}
        >
          <img src={dog.image} alt={`${dog.name}, ${dog.breed}`} loading="lazy" />
          <span className={`photo-tag ${dog.demo ? 'example' : ''}`}>
            {dog.demo ? (
              <>
                <Sparkles size={12} /> Perfil de ejemplo
              </>
            ) : (
              <>
                <PawPrint size={12} /> Nuevo en DOCLOUD
              </>
            )}
          </span>
        </button>
        <button
          className={`favorite ${allFavorites.includes(dog.id) || demoFavorites.includes(dog.id) ? 'saved' : ''}`}
          aria-label={`${allFavorites.includes(dog.id) || demoFavorites.includes(dog.id) ? 'Quitar de' : 'Guardar en'} favoritos a ${dog.name}`}
          onClick={() => favorite(dog)}
        >
          <Heart
            size={18}
            fill={
              allFavorites.includes(dog.id) || demoFavorites.includes(dog.id)
                ? 'currentColor'
                : 'none'
            }
          />
        </button>
        <div className="dog-content">
          <div className="dog-title">
            <h3>
              <button onClick={() => setModal({ type: 'dog', dog })}>{dog.name}</button>
              <span className={`sex ${dog.sex}`}>{dog.sex === 'female' ? '♀' : '♂'}</span>
            </h3>
            <span className="age">{dog.age} años</span>
          </div>
          <p className="breed">{dog.breed}</p>
          <p className="location">
            <MapPin size={13} />
            {dog.city}, Colombia
            {dog.pedigree && <span className="pedigree">Pedigree declarado</span>}
          </p>
          <div className="dog-bottom">
            <div>
              <small>
                {dog.mode === 'puppies'
                  ? 'Acuerdo por crías'
                  : dog.intention === 'pay'
                    ? 'Ofrece pagar'
                    : 'Solicita por monta'}
              </small>
              <strong>
                {dog.mode === 'puppies' ? (
                  <>
                    <PawPrint size={14} /> A convenir
                  </>
                ) : (
                  <>
                    {money(dog.amount)} <span>COP</span>
                  </>
                )}
              </strong>
            </div>
            <button
              className="card-arrow"
              aria-label={`Conocer a ${dog.name}`}
              onClick={() => setModal({ type: 'dog', dog })}
            >
              <ArrowUpRight size={20} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Cerrar menú"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('discover');
          }}
        >
          <span className="brand-mark">
            <PawPrint size={24} fill="currentColor" />
          </span>
          <span>
            do<span className="brand-light">cloud</span>
            <i />
          </span>
        </a>
        <div className="workspace-label">UN MUNDO PARA ELLOS</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.view}
              onClick={() => navigate(n.view)}
              className={view === n.view ? 'active' : ''}
            >
              <n.icon size={19} />
              <span>{labels[n.view]}</span>
              {n.view === 'proposals' && pending > 0 && <b className="nav-count">{pending}</b>}
              {n.view === 'discover' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-story">
            <span className="little-icon">
              <Heart size={19} />
              <Sparkles size={13} />
            </span>
            <h4>
              Su historia merece
              <br />
              un buen comienzo.
            </h4>
            <p>
              Conoce cómo cuidamos
              <br />
              cada paso del camino.
            </p>
            <button onClick={() => navigate('security')}>
              Nuestro compromiso <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className={view === 'security' ? 'active' : ''}
            onClick={() => navigate('security')}
          >
            <ShieldCheck size={19} />
            <span>Confianza y seguridad</span>
          </button>
          <button className={view === 'help' ? 'active' : ''} onClick={() => navigate('help')}>
            <HelpCircle size={19} />
            <span>¿Necesitas una pata?</span>
          </button>
          <div className="sidebar-foot">
            <span className="status-dot" /> Hecho para cuidar <Heart size={11} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <House size={15} />
            <ChevronRight size={13} />
            <span>{labels[view]}</span>
          </div>
          <div className="top-actions">
            <button
              className="demo-link"
              onClick={() =>
                demo ? (setDemo(false), say('Volviste a la aplicación.')) : startDemo()
              }
            >
              {demo ? (
                <>
                  <ArrowLeft size={15} /> Salir de demo
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Probar el recorrido
                </>
              )}
            </button>
            <span className="top-divider" />
            <div className="notification-wrap">
              <button
                className="icon-btn notification-btn"
                onClick={() => {
                  setNoticeOpen(!noticeOpen);
                  if (!user && !demo) say('Las notificaciones aparecerán cuando crees tu cuenta.');
                }}
                aria-label="Notificaciones"
              >
                <Bell size={20} />
                {notices.some((n) => !n.read) && <i />}
              </button>
              {noticeOpen && user && !demo && (
                <div className="notification-panel">
                  <div className="flex-between">
                    <h3>Notificaciones</h3>
                    <button
                      className="text-button"
                      onClick={() =>
                        perform(async () => {
                          await api('notifications', 'POST', {});
                          await refresh();
                        })
                      }
                    >
                      Marcar leídas
                    </button>
                  </div>
                  {notices.length ? (
                    notices.map((n) => (
                      <div className={`notice-item ${n.read ? '' : 'unread'}`} key={n.id}>
                        <span className="round-icon">
                          <Bell size={15} />
                        </span>
                        <div>
                          <p>{n.message}</p>
                          <small>{date(n.created_at)}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Aquí llegará cada novedad.</p>
                  )}
                  <small>Actualización cada 30 segundos mientras estás aquí.</small>
                </div>
              )}
            </div>
            {activeUser ? (
              <button className="profile-button" onClick={() => navigate('security')}>
                <span className="avatar">{activeUser.name.slice(0, 1)}</span>
                <span>
                  {activeUser.name.split(' ')[0]}
                  <small>{demo ? 'Cuenta de ejemplo' : 'Mi cuenta'}</small>
                </span>
                <ChevronDown size={14} />
              </button>
            ) : (
              <Button
                variant="secondary"
                className="login-button"
                onClick={() => setModal({ type: 'auth' })}
              >
                Iniciar sesión <ArrowUpRight size={15} />
              </Button>
            )}
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <Sparkles size={15} />
              <b>Modo demostración</b>
              <span>Datos locales de ejemplo. Sin pagos ni acuerdos reales.</span>
            </span>
            <label>
              Actúas como{' '}
              <select
                aria-label="Participante de la demo"
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value)}
              >
                <option value="demo-ana">Ana · Luna</option>
                <option value="demo-you">Nicolás · Toby</option>
              </select>
            </label>
          </div>
        )}
        <main id="main-content">
          {view === 'discover' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">CONEXIONES CON PROPÓSITO</p>
                  <h1>
                    Grandes historias empiezan
                    <br className="desktop-break" /> con un buen encuentro
                    <span className="green-dot">.</span>
                  </h1>
                  <p>Encuentra personas que se comprometen tanto como tú.</p>
                </div>
                <Button
                  onClick={() => {
                    if (demo) {
                      say('Sal de la demo para publicar un perfil real.');
                      return;
                    }
                    if (needAccount()) setModal({ type: 'pet' });
                  }}
                >
                  <Plus size={17} /> Publicar mi peludo
                </Button>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-label">
                    <span />
                    <span>MUCHO MÁS QUE UN MATCH</span>
                  </div>
                  <h2>
                    Conectar es fácil.
                    <br />
                    Confiar lo cambia todo.
                  </h2>
                  <p>
                    Personas comprometidas. Acuerdos claros.
                    <br />
                    Acompañamiento en cada paso de su historia.
                  </p>
                  <div className="hero-actions">
                    <Button
                      onClick={() =>
                        document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
                      }
                    >
                      Encontrar un compañero <ArrowUpRight size={17} />
                    </Button>
                    <button className="hero-learn" onClick={() => navigate('help')}>
                      Así funciona <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="hero-foot">
                    <ShieldCheck size={16} />
                    <span>El bienestar de tu peludo siempre va primero.</span>
                  </div>
                </div>
                <div className="hero-photo">
                  <img
                    src="/images/hero.jpg"
                    alt="Golden retriever disfrutando al aire libre"
                    fetchPriority="high"
                  />
                  <div className="hero-photo-shade" />
                  <div className="floating-paw">
                    <PawPrint size={31} fill="currentColor" />
                  </div>
                  <div className="hero-photo-note">
                    <span className="note-heart">
                      <Heart size={19} />
                    </span>
                    <div>
                      Cada encuentro, con intención.
                      <small>Cada historia, con responsabilidad.</small>
                    </div>
                  </div>
                </div>
              </section>
              <div className="trust-strip">
                <span>
                  <ShieldCheck size={19} />
                  <span>
                    <b>Confianza que se construye</b>
                    <small>Identidad y compromiso, paso a paso</small>
                  </span>
                </span>
                <span>
                  <ArrowLeftRight size={19} />
                  <span>
                    <b>Acuerdos a tu medida</b>
                    <small>Propón, conversa y decide</small>
                  </span>
                </span>
                <span>
                  <Heart size={19} />
                  <span>
                    <b>Acompañamiento de verdad</b>
                    <small>Una historia que merece seguimiento</small>
                  </span>
                </span>
              </div>
              <section id="explore" className="explore-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      Un compañero para su próxima historia <PawPrint size={21} />
                    </h2>
                    <p>Explora perfiles y descubre quién comparte tu misma intención.</p>
                  </div>
                  <span className="results-count">
                    {filtered.length} perfiles {showExamples ? '· incluye ejemplos' : ''}
                  </span>
                </div>
                <div className="filter-bar">
                  <label className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Buscar por nombre, raza o ciudad"
                      placeholder="Busca una raza o un peludo…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
                        <X size={14} />
                      </button>
                    )}
                  </label>
                  <label className="select-field">
                    <MapPin size={16} />
                    <select
                      aria-label="Ciudad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="">Todas las ciudades</option>
                      {[...new Set(dogs.map((d) => d.city))].sort().map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </label>
                  <label className="select-field">
                    <PawPrint size={16} />
                    <select
                      aria-label="Raza"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    >
                      <option value="">Todas las razas</option>
                      {[...new Set(dogs.map((d) => d.breed))].sort().map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </label>
                  <label className="select-field compact">
                    <select aria-label="Sexo" value={sex} onChange={(e) => setSex(e.target.value)}>
                      <option value="">Sexo</option>
                      <option value="female">Hembra</option>
                      <option value="male">Macho</option>
                    </select>
                    <ChevronDown size={14} />
                  </label>
                  <label className="select-field compact">
                    <Settings2 size={16} />
                    <select
                      aria-label="Tipo de acuerdo"
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="">Acuerdo</option>
                      <option value="money">Dinero</option>
                      <option value="puppies">Por crías</option>
                    </select>
                    <ChevronDown size={14} />
                  </label>
                </div>
                <div className="explore-meta">
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={showExamples}
                      onChange={(e) => setShowExamples(e.target.checked)}
                    />
                    <span className="mini-switch" />
                    Mostrar perfiles de ejemplo
                  </label>
                  <span>
                    <Info size={13} /> La compatibilidad se conversa y se evalúa con un veterinario.
                  </span>
                </div>
                {filtered.length ? (
                  <div className="dog-grid">
                    {filtered.map((d) => (
                      <DogCard key={d.id} dog={d} />
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={Search}
                    title="Todavía no hay un encuentro por aquí"
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setQuery('');
                          setCity('');
                          setBreed('');
                          setSex('');
                          setMode('');
                          setShowExamples(true);
                        }}
                      >
                        Ver todos los perfiles
                      </Button>
                    }
                  >
                    Prueba otra búsqueda o amplía tus filtros.
                  </Empty>
                )}
              </section>
              <section className="bottom-invite">
                <div className="invite-icon">
                  <PawPrint size={30} />
                </div>
                <div>
                  <h3>¿Y si su próxima historia empieza contigo?</h3>
                  <p>Crea su perfil y deja que las buenas conexiones te encuentren.</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (needAccount()) setModal({ type: 'pet' });
                  }}
                >
                  Crear su perfil <ArrowRight size={16} />
                </Button>
              </section>
            </>
          )}
          {view === 'dashboard' && (
            <>
              <PageTitle
                eyebrow="TODO EN SU LUGAR"
                title={`Hola${activeUser ? ', ' + activeUser.name.split(' ')[0] : ''}. Qué bueno verte por aquí.`}
                text="Un espacio para cuidar sus conexiones, de principio a fin."
                action={
                  <Button
                    onClick={() => {
                      if (needAccount()) setModal({ type: 'pet' });
                    }}
                  >
                    <Plus size={16} /> Agregar peludo
                  </Button>
                }
              />
              <div className="stats-grid">
                {[
                  { name: 'Mis peludos', value: myDogs.length, icon: PawPrint, target: 'pets' },
                  {
                    name: 'Por responder',
                    value: pending,
                    icon: MessageCircle,
                    target: 'proposals',
                  },
                  {
                    name: 'Acuerdos guardados',
                    value: myAgreements.length,
                    icon: FileCheck2,
                    target: 'agreements',
                  },
                  {
                    name: 'Mis favoritos',
                    value: allFavorites.length,
                    icon: Heart,
                    target: 'favorites',
                  },
                ].map((s) => (
                  <button
                    className="stat-card"
                    key={s.name}
                    onClick={() => navigate(s.target as View)}
                  >
                    <span className="round-icon">
                      <s.icon size={21} />
                    </span>
                    <strong>{s.value}</strong>
                    <span>
                      {s.name}
                      <ArrowUpRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="dashboard-columns">
                <section className="panel">
                  <div className="section-heading">
                    <h2>Un comienzo con confianza</h2>
                    <ShieldCheck size={22} />
                  </div>
                  <p className="muted">Completa estos pasos a tu ritmo.</p>
                  {[
                    {
                      title: 'Crea tu cuenta',
                      desc: 'Tu espacio personal en DOCLOUD.',
                      done: !!activeUser,
                      fn: () => setModal({ type: 'auth', register: true }),
                    },
                    {
                      title: 'Protege tu acceso',
                      desc: 'Activa la autenticación en dos pasos.',
                      done: !!activeUser?.mfaEnabled,
                      fn: () => navigate('security'),
                    },
                    {
                      title: 'Presenta a tu peludo',
                      desc: 'Una buena foto y datos claros hacen la diferencia.',
                      done: myDogs.length > 0,
                      fn: () => {
                        if (needAccount()) setModal({ type: 'pet' });
                      },
                    },
                    {
                      title: 'Conoce personas con tu misma intención',
                      desc: 'Explora, pregunta y construye un acuerdo.',
                      done: myProposals.length > 0,
                      fn: () => navigate('discover'),
                    },
                  ].map((s, i) => (
                    <button className="checklist-row" key={s.title} onClick={s.fn}>
                      <span className={`step-check ${s.done ? 'done' : ''}`}>
                        {s.done ? <Check size={16} /> : i + 1}
                      </span>
                      <span>
                        <b>{s.title}</b>
                        <small>{s.desc}</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </section>
                <section className="panel soft-green">
                  <span className="eyebrow">EL COMPROMISO ES MUTUO</span>
                  <h2>
                    Un match abre
                    <br />
                    la conversación.
                  </h2>
                  <p>
                    Un acuerdo claro construye la confianza. Revisa cada condición y conversa sobre
                    cuidados, gastos y las posibles crías antes de aceptar.
                  </p>
                  <Button variant="secondary" onClick={() => navigate('help')}>
                    Conoce el recorrido <ArrowRight size={16} />
                  </Button>
                  <PawPrint className="decorative-paw" size={90} />
                </section>
              </div>
              <section className="panel">
                <div className="section-heading">
                  <h2>Lo próximo en tu historia</h2>
                  <button className="text-button" onClick={() => navigate('proposals')}>
                    Ver propuestas <ArrowRight size={15} />
                  </button>
                </div>
                {pending ? (
                  <p>
                    Tienes {pending} propuesta{pending !== 1 ? 's' : ''} esperando tu respuesta.
                    Revisa las condiciones y decide con calma.
                  </p>
                ) : (
                  <div className="inline-empty">
                    <CalendarDays size={23} />
                    <p>
                      Aún no tienes acciones pendientes. Las próximas novedades aparecerán aquí.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
          {view === 'pets' && (
            <>
              <PageTitle
                eyebrow="LOS PROTAGONISTAS"
                title="Mis peludos"
                text="Cada personalidad merece un perfil propio."
                action={
                  <Button
                    onClick={() => {
                      if (demo) {
                        say('Publica perfiles reales al salir de la demo.');
                        return;
                      }
                      if (needAccount()) setModal({ type: 'pet' });
                    }}
                  >
                    <Plus size={17} /> Agregar peludo
                  </Button>
                }
              />
              {myDogs.length ? (
                <div className="dog-grid">
                  {myDogs.map((d) => (
                    <div key={d.id}>
                      <DogCard dog={d} />
                      {!demo && (
                        <button
                          className="text-button danger-text delete-dog"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el perfil de ${d.name}?`))
                              perform(async () => {
                                await api(`dogs/${d.id}`, 'DELETE');
                                await refresh();
                                say('Perfil eliminado.');
                              });
                          }}
                        >
                          <Trash2 size={13} /> Eliminar perfil
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Aquí comienza su historia"
                  action={
                    <Button
                      onClick={() => {
                        if (needAccount()) setModal({ type: 'pet' });
                      }}
                    >
                      <Plus size={16} /> Crear su primer perfil
                    </Button>
                  }
                >
                  Agrega sus fotos, cuéntanos cómo es y define qué tipo de acuerdo buscas. Los datos
                  veterinarios no se dan por verificados.
                </Empty>
              )}
              <div className="info-banner">
                <ShieldCheck size={19} />
                <p>
                  Publicar requiere segundo factor y tu confirmación de que tienes autoridad para
                  decidir sobre la mascota. La aptitud reproductiva requiere evaluación veterinaria.
                </p>
              </div>
            </>
          )}
          {view === 'favorites' && (
            <>
              <PageTitle
                eyebrow="CONEXIONES QUE TE GUSTAN"
                title="Un lugar para tus favoritos"
                text="Guarda perfiles y vuelve a ellos cuando quieras."
              />
              {dogs.filter((d) => allFavorites.includes(d.id) || demoFavorites.includes(d.id))
                .length ? (
                <div className="dog-grid">
                  {dogs
                    .filter((d) => allFavorites.includes(d.id) || demoFavorites.includes(d.id))
                    .map((d) => (
                      <DogCard key={d.id} dog={d} />
                    ))}
                </div>
              ) : (
                <Empty
                  icon={Heart}
                  title="¿Alguien te robó una sonrisa?"
                  action={
                    <Button onClick={() => navigate('discover')}>
                      Explorar perfiles <ArrowRight size={16} />
                    </Button>
                  }
                >
                  Toca el corazón de un perfil para encontrarlo aquí después.
                </Empty>
              )}
            </>
          )}
          {view === 'proposals' && (
            <>
              <PageTitle
                eyebrow="CONVERSACIONES CON INTENCIÓN"
                title="Cada propuesta, un paso más cerca"
                text="Condiciones claras. Espacio para conversar. Una decisión de ambos."
              />
              {!myProposals.length ? (
                <Empty
                  icon={ArrowLeftRight}
                  title="La primera conversación está por comenzar"
                  action={
                    <div className="button-row">
                      <Button onClick={() => navigate('discover')}>Explorar peludos</Button>
                      <Button variant="secondary" onClick={() => startDemo()}>
                        Probar una negociación
                      </Button>
                    </div>
                  }
                >
                  Cuando envíes o recibas una propuesta, podrás revisarla, hacer una contrapropuesta
                  y decidir aquí.
                </Empty>
              ) : (
                <div className="conversation-layout">
                  <div className="conversation-list">
                    {myProposals.map((p) => {
                      const left = findDog(p.requester_dog),
                        right = findDog(p.recipient_dog);
                      return (
                        <button
                          key={p.id}
                          className={`conversation-item ${(selectedProposal || myProposals[0]?.id) === p.id ? 'selected' : ''}`}
                          onClick={() => setSelectedProposal(p.id)}
                        >
                          <div className="pair-avatars">
                            <img src={left.image} alt={left.name} />
                            <img src={right.image} alt={right.name} />
                          </div>
                          <div>
                            <b>
                              {left.name} <span>&</span> {right.name}
                            </b>
                            <small>
                              {statusLabel[p.status]} · v{p.version}
                            </small>
                          </div>
                          {p.status === 'pending' && p.last_by !== activeUser?.id && (
                            <span className="nav-dot" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const p = myProposals.find((p) => p.id === selectedProposal) || myProposals[0];
                    const left = findDog(p.requester_dog),
                      right = findDog(p.recipient_dog),
                      latest = p.revisions.at(-1)!;
                    return (
                      <section className="panel proposal-detail">
                        <div className="flex-between">
                          <div>
                            <span
                              className={`badge ${p.status === 'accepted' ? 'green' : 'neutral'}`}
                            >
                              {statusLabel[p.status]}
                            </span>
                            <h2>
                              {left.name} <span className="muted">&</span> {right.name}
                            </h2>
                            <p className="muted">
                              Versión {p.version} · {date(latest.created_at)}
                            </p>
                          </div>
                          <span className="round-icon">
                            <ArrowLeftRight size={23} />
                          </span>
                        </div>
                        <TermsSummary
                          terms={latest.terms}
                          requester={left.ownerName}
                          recipient={right.ownerName}
                        />
                        <div className="version-history">
                          <h4>Una conversación transparente</h4>
                          {p.revisions.map((r) => (
                            <div className="history-row" key={r.version}>
                              <span className="history-dot" />
                              <div>
                                <b>
                                  Versión {r.version} ·{' '}
                                  {r.author_id === p.requester_id
                                    ? left.ownerName
                                    : right.ownerName}
                                </b>
                                <p>
                                  {r.terms.mode === 'money'
                                    ? `${money(r.terms.amount)} · ${r.terms.payer === 'requester' ? left.ownerName : right.ownerName} paga`
                                    : 'Distribución por crías'}{' '}
                                  · {date(r.created_at)}
                                </p>
                                <details>
                                  <summary>Ver condiciones de esta versión</summary>
                                  <TermsSummary
                                    terms={r.terms}
                                    requester={left.ownerName}
                                    recipient={right.ownerName}
                                  />
                                </details>
                              </div>
                            </div>
                          ))}
                        </div>
                        {p.status === 'pending' ? (
                          p.last_by === activeUser?.id ? (
                            <div className="waiting-box">
                              <Clock size={20} />
                              <span>
                                Tu propuesta está esperando respuesta.
                                {demo && (
                                  <button
                                    className="text-button"
                                    onClick={() =>
                                      setDemoRole(demoRole === 'demo-ana' ? 'demo-you' : 'demo-ana')
                                    }
                                  >
                                    Cambiar al otro participante <ArrowLeftRight size={14} />
                                  </button>
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                disabled={busy}
                                onClick={() => respond(p, 'cancel')}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="info-banner">
                                <Info size={18} />
                                <p>
                                  Al aceptar confirmas esta versión exacta. El contacto seguirá
                                  protegido hasta completar las validaciones y habilitar los pagos.
                                </p>
                              </div>
                              <div className="button-row">
                                <Button disabled={busy} onClick={() => respond(p, 'accept')}>
                                  <Check size={17} /> Aceptar condiciones
                                </Button>
                                <Button
                                  disabled={busy}
                                  variant="secondary"
                                  onClick={() => setModal({ type: 'offer', proposal: p })}
                                >
                                  <ArrowLeftRight size={16} /> Contrapropuesta
                                </Button>
                                <Button
                                  disabled={busy}
                                  variant="ghost"
                                  onClick={() => respond(p, 'decline')}
                                >
                                  Rechazar
                                </Button>
                              </div>
                            </>
                          )
                        ) : (
                          <div className="info-banner">
                            <FileCheck2 size={20} />
                            <p>
                              {p.status === 'accepted'
                                ? 'La versión aceptada está guardada. Continúa en Acuerdos y seguimiento.'
                                : 'Esta conversación está cerrada. Su historial se conserva.'}
                            </p>
                            {p.status === 'accepted' && (
                              <button
                                className="text-button"
                                onClick={() => navigate('agreements')}
                              >
                                Ver acuerdo <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })()}
                </div>
              )}
            </>
          )}
          {view === 'agreements' && (
            <>
              <PageTitle
                eyebrow="EL COMPROMISO CONTINÚA"
                title="Una historia que acompañamos"
                text="Acuerdos, evidencias y próximos pasos, en un mismo lugar."
              />
              {!myAgreements.length ? (
                <Empty
                  icon={FileCheck2}
                  title="Los buenos acuerdos se construyen entre dos"
                  action={
                    <Button onClick={() => navigate('proposals')}>
                      Ver propuestas <ArrowRight size={16} />
                    </Button>
                  }
                >
                  Cuando ambas personas acepten la misma versión, encontrarás aquí el acuerdo y su
                  seguimiento.
                </Empty>
              ) : (
                <>
                  <div className="agreement-tabs">
                    {myAgreements.map((a) => (
                      <button
                        key={a.id}
                        className={
                          (selectedAgreement || myAgreements[0]?.id) === a.id ? 'active' : ''
                        }
                        onClick={() => setSelectedAgreement(a.id)}
                      >
                        <PawPrint size={16} />
                        {findDog(a.requester_dog).name} & {findDog(a.recipient_dog).name}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const a =
                      myAgreements.find((a) => a.id === selectedAgreement) || myAgreements[0];
                    return (
                      <div className="agreement-layout">
                        <div>
                          <section className="panel">
                            <div className="flex-between">
                              <div>
                                <span className="badge green">
                                  <CheckCheck size={13} /> Condiciones aceptadas
                                </span>
                                <h2>
                                  {findDog(a.requester_dog).name} & {findDog(a.recipient_dog).name}
                                </h2>
                                <p className="muted">Guardado el {date(a.created_at)}</p>
                              </div>
                              <button
                                className="icon-btn"
                                aria-label="Descargar acuerdo"
                                onClick={() => {
                                  if (demo) {
                                    const blob = new Blob([JSON.stringify(a, null, 2)], {
                                        type: 'application/json',
                                      }),
                                      url = URL.createObjectURL(blob),
                                      link = document.createElement('a');
                                    link.href = url;
                                    link.download = 'docloud-demo.json';
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  } else window.location.href = `/api/agreements/${a.id}/export`;
                                }}
                              >
                                <Download size={21} />
                              </button>
                            </div>
                            <TermsSummary
                              terms={a.terms}
                              requester={findDog(a.requester_dog).ownerName}
                              recipient={findDog(a.recipient_dog).ownerName}
                            />
                            <p className="hash-note">
                              <LockKeyhole size={12} />{' '}
                              {demo
                                ? 'Acuerdo ilustrativo guardado en este navegador.'
                                : `Huella SHA-256: ${a.terms_hash}`}
                            </p>
                          </section>
                          <section className="panel">
                            <div className="section-heading">
                              <h2>Bitácora de su historia</h2>
                              <span className="badge neutral">
                                Declaraciones de los participantes
                              </span>
                            </div>
                            <EventForm
                              agreement={a}
                              demo={demo}
                              actor={activeUser!.id}
                              busy={busy}
                              onSave={async (data) => {
                                return perform(async () => {
                                  if (demo) {
                                    setDemoAgreements((all) =>
                                      all.map((x) =>
                                        x.id === a.id
                                          ? {
                                              ...x,
                                              events: [
                                                {
                                                  id: crypto.randomUUID(),
                                                  kind: data.kind,
                                                  note: data.note,
                                                  due_at: data.dueAt,
                                                  image: data.image,
                                                  created_at: new Date().toISOString(),
                                                  author_id: demoRole,
                                                },
                                                ...x.events,
                                              ],
                                            }
                                          : x,
                                      ),
                                    );
                                  } else {
                                    await api(`agreements/${a.id}/events`, 'POST', data);
                                    await refresh();
                                  }
                                  say('Registro agregado al seguimiento.');
                                });
                              }}
                            />
                            {a.events.length ? (
                              <div className="timeline">
                                {a.events.map((e) => (
                                  <div className="timeline-event" key={e.id}>
                                    <span className="timeline-mark">
                                      <PawPrint size={14} />
                                    </span>
                                    <div>
                                      <div className="flex-between">
                                        <b>{eventLabels[e.kind]}</b>
                                        <small>{date(e.created_at)}</small>
                                      </div>
                                      <p>{e.note}</p>
                                      {e.due_at && (
                                        <span className="badge neutral">
                                          <CalendarDays size={12} /> Fecha registrada:{' '}
                                          {date(e.due_at)}
                                        </span>
                                      )}
                                      {e.image && (
                                        <img
                                          className="evidence-image"
                                          src={e.image}
                                          alt="Evidencia aportada por un participante"
                                        />
                                      )}
                                      <small className="event-disclaimer">
                                        Aportado por un participante · sin corroboración
                                        independiente
                                      </small>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="inline-empty">
                                <Camera size={23} />
                                <p>
                                  Agrega la primera nota, una fecha o una evidencia. Ningún registro
                                  confirma por sí solo un resultado.
                                </p>
                              </div>
                            )}
                          </section>
                          <FamilyTree
                            parents={[findDog(a.requester_dog), findDog(a.recipient_dog)]}
                            puppies={a.puppies || []}
                            terms={a.terms}
                            busy={busy}
                            onSave={(data, puppyId, version) =>
                              perform(async () => {
                                if (demo) {
                                  setDemoAgreements((all) =>
                                    all.map((x) =>
                                      x.id === a.id
                                        ? {
                                            ...x,
                                            puppies: puppyId
                                              ? (x.puppies || []).map((p) =>
                                                  p.id === puppyId
                                                    ? {
                                                        ...data,
                                                        id: puppyId,
                                                        version: p.version + 1,
                                                      }
                                                    : p,
                                                )
                                              : [
                                                  ...(x.puppies || []),
                                                  { ...data, id: crypto.randomUUID(), version: 1 },
                                                ],
                                          }
                                        : x,
                                    ),
                                  );
                                } else {
                                  await api(
                                    `agreements/${a.id}/puppies${puppyId ? '/' + puppyId : ''}`,
                                    'POST',
                                    { ...data, ...(version ? { version } : {}) },
                                  );
                                  await refresh();
                                }
                                say('Su historia quedó registrada.');
                              })
                            }
                          />
                        </div>
                        <aside className="agreement-aside">
                          <section className="panel">
                            <h3>Antes de encontrarse</h3>
                            <p className="muted">El acuerdo es el comienzo.</p>
                            {[
                              {
                                name: 'Condiciones aceptadas',
                                state: 'done',
                                detail: 'Ambas partes aceptaron la misma versión.',
                              },
                              {
                                name: 'Identidad y relación con la mascota',
                                state: 'pending',
                                detail: 'Verificación externa pendiente de integración.',
                              },
                              {
                                name: 'Evaluación veterinaria',
                                state: 'pending',
                                detail: 'Debe ser realizada por un profesional.',
                              },
                              {
                                name: 'Pago mediante proveedor',
                                state: 'pending',
                                detail: 'No disponible. No se ha cobrado ni retenido dinero.',
                              },
                              {
                                name: 'Contacto y encuentro',
                                state: 'locked',
                                detail: 'Permanece bloqueado hasta completar los requisitos.',
                              },
                            ].map((s, i) => (
                              <div className="agreement-step" key={s.name}>
                                <span className={`step-check ${s.state === 'done' ? 'done' : ''}`}>
                                  {s.state === 'done' ? (
                                    <Check size={14} />
                                  ) : s.state === 'locked' ? (
                                    <LockKeyhole size={13} />
                                  ) : (
                                    i + 1
                                  )}
                                </span>
                                <div>
                                  <b>{s.name}</b>
                                  <p>{s.detail}</p>
                                </div>
                              </div>
                            ))}
                          </section>
                          <section className="panel soft-green">
                            <LockKeyhole size={25} />
                            <h3>Tu confianza se cuida</h3>
                            <p>
                              Los contactos privados aún no se liberan. No envíes dinero fuera de la
                              plataforma basándote en este acuerdo.
                            </p>
                            <Button variant="secondary" disabled>
                              Pagos aún no habilitados <LockKeyhole size={14} />
                            </Button>
                          </section>
                          <button
                            className="text-button"
                            onClick={() => setModal({ type: 'report', subject: `Acuerdo ${a.id}` })}
                          >
                            <Flag size={15} /> Reportar un problema
                          </button>
                        </aside>
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}
          {view === 'security' && (
            <>
              <PageTitle
                eyebrow="CONFIANZA, SIN ATAJOS"
                title="Cuidamos lo que más importa"
                text="Tu acceso, tus datos y la claridad de cada compromiso."
              />
              <Security
                user={user}
                demo={demo}
                onAuth={() => setModal({ type: 'auth', register: true })}
                onRefresh={refresh}
                say={say}
                onLogout={() =>
                  perform(async () => {
                    await api('auth/logout', 'POST', {});
                    setDemo(false);
                    await refresh();
                    say('Sesión cerrada.');
                  })
                }
              />
            </>
          )}
          {view === 'help' && (
            <>
              <PageTitle
                eyebrow="TE DAMOS UNA PATA"
                title="Cada paso tiene su lugar"
                text="Así convertimos una intención en un proceso claro y acompañado."
              />
              <div className="how-grid">
                {[
                  {
                    icon: PawPrint,
                    title: '1. Presenta a tu peludo',
                    text: 'Crea tu cuenta, activa el segundo factor y publica un perfil con información honesta y autorización para decidir.',
                  },
                  {
                    icon: Compass,
                    title: '2. Encuentra tu conexión',
                    text: 'Explora por ciudad, raza e intención. La compatibilidad no se asegura con un perfil: requiere conversación y evaluación profesional.',
                  },
                  {
                    icon: ArrowLeftRight,
                    title: '3. Construyan un acuerdo',
                    text: 'Propongan montos y quién paga, o reglas de distribución por crías. Aclaren cancelaciones, gastos y la ausencia de gestación.',
                  },
                  {
                    icon: FileCheck2,
                    title: '4. Acompañen su historia',
                    text: 'Conserven la versión aceptada y registren evidencias, fechas, cuidados y destino de las crías. Las declaraciones necesitan corroboración.',
                  },
                ].map((s) => (
                  <section className="panel" key={s.title}>
                    <span className="round-icon">
                      <s.icon size={25} />
                    </span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </section>
                ))}
              </div>
              <section className="panel faq">
                <h2>Buenas preguntas, respuestas claras</h2>
                {[
                  {
                    q: '¿DOCLOUD garantiza una gestación o la salud de las crías?',
                    a: 'No. El servicio organiza la conversación y el seguimiento. La aptitud reproductiva, los riesgos, los cuidados y cualquier decisión clínica requieren un veterinario. Un acuerdo no obliga a continuar si se compromete el bienestar.',
                  },
                  {
                    q: '¿Qué significa “perfil de ejemplo”?',
                    a: 'Es un personaje ficticio para recorrer el producto. Sus fotos son ilustrativas; no representa a una persona verificada ni una oferta real. La demo se guarda únicamente en este navegador.',
                  },
                  {
                    q: '¿Ya puedo pagar o cobrar una monta?',
                    a: 'Todavía no. Los pagos y la verificación de identidad necesitan proveedores externos y políticas operativas antes de activarse. No hay custodia de fondos, cobros ni liberación de contactos en esta versión.',
                  },
                  {
                    q: '¿Qué pasa si alguien cambia las condiciones?',
                    a: 'Cada contrapropuesta genera una nueva versión. Solo la otra persona puede aceptarla. Una versión anterior no se puede aceptar después de un cambio. El acuerdo guarda una copia y su huella digital.',
                  },
                  {
                    q: '¿Qué sucede si alguien cancela o no hay gestación?',
                    a: 'Las dos situaciones deben quedar previstas antes de aceptar. La plantilla propone detener el proceso sin nuevos cargos automáticos y requerir un nuevo acuerdo para otro intento. No se prometen devoluciones que un proveedor no pueda ejecutar.',
                  },
                  {
                    q: '¿Y si hay una urgencia, fallece una cría o nadie puede recibirla?',
                    a: 'El cuidado tiene prioridad sobre la distribución. Debe buscarse atención profesional y registrar la incidencia. Si cambia la cantidad de crías disponibles o la capacidad de recibirlas, las partes deben detener la distribución y acordar un plan nuevo. No hay entrega ni cobro automáticos.',
                  },
                  {
                    q: '¿Comprar un cachorro forma parte de esta versión?',
                    a: 'Esta primera versión se centra en los responsables que consideran un cruce. Un mercado de compra de cachorros requiere un recorrido, validaciones y responsabilidades adicionales y todavía no está habilitado.',
                  },
                  {
                    q: '¿Hay notificaciones por correo?',
                    a: 'Las notificaciones dentro de la aplicación ya funcionan. El envío de correos y los recordatorios cuando estás desconectado todavía requieren configurar un servicio de correo y una cola de entregas.',
                  },
                ].map((s) => (
                  <details key={s.q}>
                    <summary>
                      {s.q}
                      <Plus size={17} />
                    </summary>
                    <p>{s.a}</p>
                  </details>
                ))}
              </section>
              <div className="bottom-invite">
                <ShieldCheck size={30} />
                <div>
                  <h3>¿Algo no te da confianza?</h3>
                  <p>Los reportes quedan registrados para revisión humana.</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!user) {
                      setModal({ type: 'auth' });
                      return;
                    }
                    setModal({ type: 'report', subject: 'Consulta general' });
                  }}
                >
                  Crear un reporte <Flag size={15} />
                </Button>
              </div>
            </>
          )}
          <footer className="footer">
            <span>
              <PawPrint size={14} /> DOCLOUD <span>·</span> Buenos encuentros, mejores historias.
            </span>
            <div>
              <button onClick={() => setModal({ type: 'legal', page: 'privacy' })}>
                Privacidad
              </button>
              <button onClick={() => setModal({ type: 'legal', page: 'terms' })}>
                Condiciones
              </button>
              <span>
                Hecho con intención <Heart size={12} />
              </span>
            </div>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Info size={19} />
          <span>{toast}</span>
          <button aria-label="Cerrar aviso" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <ModalShell
          title={
            modal.type === 'auth'
              ? modal.register
                ? 'El comienzo de una buena historia'
                : 'Qué bueno verte de nuevo'
              : modal.type === 'pet'
                ? 'Presenta a tu peludo'
                : modal.type === 'dog'
                  ? `Conoce a ${modal.dog.name}`
                  : modal.type === 'offer'
                    ? modal.proposal
                      ? 'Construye tu contrapropuesta'
                      : 'Una propuesta con intención'
                    : modal.type === 'report'
                      ? 'Cuéntanos qué pasó'
                      : modal.page === 'privacy'
                        ? 'Privacidad, con claridad'
                        : 'Condiciones de esta versión'
          }
          onClose={() => {
            setModal(null);
            setError('');
          }}
          wide={modal.type === 'offer' || modal.type === 'dog'}
        >
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {modal.type === 'auth' && (
            <AuthForm
              register={!!modal.register}
              busy={busy}
              onToggle={() => {
                setError('');
                setModal({ type: 'auth', register: !modal.register });
              }}
              onSubmit={async (data, register) => {
                let result: { user?: User; requiresMfa?: boolean } = {};
                await perform(async () => {
                  result = await api(register ? 'auth/register' : 'auth/login', 'POST', data);
                  if (!result.requiresMfa) {
                    setDemo(false);
                    setModal(null);
                    await refresh();
                    navigate(register ? 'security' : 'dashboard');
                    say(
                      register
                        ? 'Tu cuenta está lista. Ahora protégela con el segundo factor.'
                        : 'Bienvenido de nuevo.',
                    );
                  }
                });
                return !!result.requiresMfa;
              }}
            />
          )}
          {modal.type === 'pet' && (
            <PetForm
              busy={busy}
              onSave={(data) =>
                perform(async () => {
                  await api('dogs', 'POST', data);
                  setModal(null);
                  await refresh();
                  navigate('pets');
                  say('Su perfil ya forma parte de DOCLOUD.');
                })
              }
            />
          )}
          {modal.type === 'dog' && (
            <DogDetail
              dog={modal.dog}
              mine={modal.dog.ownerId === activeUser?.id}
              onFavorite={() => favorite(modal.dog)}
              onPropose={() => {
                if (modal.dog.demo) {
                  startDemo(modal.dog);
                  return;
                }
                if (!needAccount()) {
                  setModal(null);
                  if (!user) setModal({ type: 'auth', register: true });
                  return;
                }
                if (!myDogs.length) {
                  setModal({ type: 'pet' });
                  say('Primero crea el perfil de tu mascota.');
                  return;
                }
                setModal({ type: 'offer', dog: modal.dog });
              }}
              onReport={() => {
                if (!user) {
                  setModal({ type: 'auth' });
                  return;
                }
                setModal({ type: 'report', subject: `Perfil ${modal.dog.name} (${modal.dog.id})` });
              }}
            />
          )}
          {modal.type === 'offer' && (
            <OfferForm
              initial={
                modal.proposal?.revisions.at(-1)?.terms || {
                  ...defaultTerms,
                  amount: modal.dog?.amount || 250000,
                  mode: modal.dog?.mode || 'money',
                }
              }
              ownDogs={myDogs}
              dog={modal.dog}
              proposal={modal.proposal}
              dogs={dogs}
              busy={busy}
              onSave={(terms, ownDog) =>
                perform(async () => {
                  if (demo) {
                    const p = modal.proposal!;
                    const version = p.version + 1;
                    setDemoProposals((all) =>
                      all.map((x) =>
                        x.id === p.id
                          ? {
                              ...x,
                              version,
                              last_by: demoRole,
                              revisions: [
                                ...x.revisions,
                                {
                                  version,
                                  author_id: demoRole,
                                  terms,
                                  created_at: new Date().toISOString(),
                                },
                              ],
                            }
                          : x,
                      ),
                    );
                    say('Contrapropuesta guardada. Cambia de participante para responder.');
                  } else {
                    await api(
                      modal.proposal ? `proposals/${modal.proposal.id}/counter` : 'proposals',
                      'POST',
                      modal.proposal
                        ? { version: modal.proposal.version, terms }
                        : { requesterDog: ownDog, recipientDog: modal.dog!.id, terms },
                    );
                    await refresh();
                    say('Propuesta enviada. La otra persona podrá revisar esta versión.');
                  }
                  setModal(null);
                  navigate('proposals');
                })
              }
            />
          )}
          {modal.type === 'report' && (
            <ReportForm
              subject={modal.subject}
              busy={busy}
              onSave={(reason) =>
                perform(async () => {
                  if (demo) {
                    say('Este es un reporte de demostración; no se envió.');
                  } else {
                    await api('reports', 'POST', { subject: modal.subject, reason });
                    say('Reporte registrado. Está pendiente de revisión humana.');
                  }
                  setModal(null);
                })
              }
            />
          )}
          {modal.type === 'legal' && <Legal page={modal.page} />}
        </ModalShell>
      )}
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading secondary-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function ModalShell({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select,textarea,a[href],[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-btn" aria-label="Cerrar ventana" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
function AuthForm({
  register,
  busy,
  onToggle,
  onSubmit,
}: {
  register: boolean;
  busy: boolean;
  onToggle: () => void;
  onSubmit: (data: unknown, register: boolean) => Promise<boolean>;
}) {
  const [mfa, setMfa] = useState(false),
    [show, setShow] = useState(false);
  return (
    <form
      className="stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setMfa(
          await onSubmit(
            {
              name: f.get('name'),
              email: f.get('email'),
              password: f.get('password'),
              city: f.get('city'),
              consent: f.get('consent') === 'on',
              ...(mfa ? { code: f.get('code') } : {}),
            },
            register,
          ),
        );
      }}
    >
      <p className="muted">
        {register
          ? 'Conecta con personas que comparten tu compromiso. Primero, creemos un espacio seguro para ti.'
          : 'Tu peludo y sus próximas historias te esperan.'}
      </p>
      {register && (
        <FormField label="Tu nombre">
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={70}
            placeholder="¿Cómo te llamas?"
          />
        </FormField>
      )}
      <FormField label="Correo electrónico">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          maxLength={254}
        />
      </FormField>
      {register && (
        <FormField label="Ciudad">
          <input
            name="city"
            required
            minLength={2}
            maxLength={60}
            placeholder="Por ejemplo, Bogotá"
            autoComplete="address-level2"
          />
        </FormField>
      )}
      <FormField
        label="Contraseña"
        hint={register ? 'Usa al menos 12 caracteres. Una frase larga puede ayudarte.' : undefined}
      >
        <div className="password-input">
          <input
            name="password"
            type={show ? 'text' : 'password'}
            required
            minLength={register ? 12 : 1}
            maxLength={128}
            autoComplete={register ? 'new-password' : 'current-password'}
            placeholder={register ? 'Crea una contraseña segura' : 'Tu contraseña'}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormField>
      {mfa && (
        <FormField label="Código de tu autenticador">
          <input
            autoFocus
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
          />
        </FormField>
      )}
      {register && (
        <label className="checkbox-label">
          <input name="consent" type="checkbox" required />
          <span>
            Acepto las condiciones de esta versión y el tratamiento de mis datos para operar mi
            cuenta. Soy mayor de edad.
          </span>
        </label>
      )}
      <Button disabled={busy} type="submit" className="full-width">
        {busy
          ? 'Un momento…'
          : register
            ? 'Crear mi cuenta'
            : mfa
              ? 'Verificar e ingresar'
              : 'Entrar a mi cuenta'}
        <ArrowRight size={16} />
      </Button>
      <p className="auth-toggle">
        {register ? '¿Ya eres parte de DOCLOUD?' : '¿Tu primera vez por aquí?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMfa(false);
            onToggle();
          }}
        >
          {register ? 'Inicia sesión' : 'Crea tu cuenta'}
        </button>
      </p>
      <div className="auth-foot">
        <LockKeyhole size={13} /> Tu contraseña se guarda protegida. Nunca en texto plano.
      </div>
      {!register && (
        <small className="muted">
          La recuperación automática de cuenta aún no está habilitada. Conserva tu contraseña y
          acceso al autenticador.
        </small>
      )}
    </form>
  );
}
async function uploadPhoto(file: File, kind: 'pet' | 'evidence', agreementId?: string) {
  if (file.size > 5 * 1024 * 1024) throw new Error('La foto debe pesar menos de 5 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Elige una imagen JPG, PNG o WebP.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    reader.readAsDataURL(file);
  });
  return (await api<{ url: string }>('upload', 'POST', { data, kind, agreementId })).url;
}
function PhotoUpload({
  kind = 'pet',
  agreementId,
  onUpload,
}: {
  kind?: 'pet' | 'evidence';
  agreementId?: string;
  onUpload: (url: string) => void;
}) {
  const [preview, setPreview] = useState(''),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState('');
  return (
    <div>
      <label className={`photo-upload ${preview ? 'has-photo' : ''}`}>
        {preview ? (
          <img src={preview} alt="Vista previa de la foto subida" />
        ) : (
          <>
            <span className="round-icon">
              <Camera size={24} />
            </span>
            <b>
              {uploading
                ? 'Subiendo su mejor sonrisa…'
                : kind === 'pet'
                  ? 'Una foto que cuente cómo es'
                  : 'Agregar evidencia fotográfica'}
            </b>
            <small>JPG, PNG o WebP · máximo 5 MB</small>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setError('');
            try {
              const url = await uploadPhoto(file, kind, agreementId);
              setPreview(url);
              onUpload(url);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setUploading(false);
            }
          }}
        />
        {preview && (
          <span className="change-photo">
            <Camera size={14} /> Cambiar foto
          </span>
        )}
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function PetForm({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (data: unknown) => Promise<boolean | void>;
}) {
  const [image, setImage] = useState(''),
    [intention, setIntention] = useState('charge'),
    [localError, setLocalError] = useState('');
  return (
    <form
      className="stack-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!image) {
          setLocalError('Sube una foto para completar su perfil.');
          return;
        }
        const f = new FormData(e.currentTarget);
        onSave({
          name: f.get('name'),
          breed: f.get('breed'),
          sex: f.get('sex'),
          age: Number(f.get('age')),
          city: f.get('city'),
          bio: f.get('bio'),
          image,
          pedigree: f.get('pedigree') === 'on',
          intention,
          mode: intention === 'puppies' ? 'puppies' : 'money',
          amount: intention === 'puppies' ? 0 : Number(f.get('amount')),
          guardianConsent: true,
          welfareConsent: true,
        });
      }}
    >
      <PhotoUpload onUpload={setImage} />
      <div className="form-grid">
        <FormField label="Su nombre">
          <input
            name="name"
            required
            minLength={2}
            maxLength={40}
            placeholder="Por ejemplo, Toby"
          />
        </FormField>
        <FormField label="Raza">
          <input
            name="breed"
            required
            minLength={2}
            maxLength={70}
            placeholder="Jack Russell Terrier"
          />
        </FormField>
        <FormField label="Sexo">
          <select name="sex" required>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </FormField>
        <FormField label="Edad en años">
          <input name="age" type="number" required min={0} max={30} step={0.5} placeholder="3" />
        </FormField>
        <FormField label="Ciudad">
          <input name="city" required minLength={2} maxLength={60} placeholder="Bogotá" />
        </FormField>
        <FormField label="¿Qué acuerdo buscas?">
          <select value={intention} onChange={(e) => setIntention(e.target.value)}>
            <option value="charge">Cobrar por monta</option>
            <option value="pay">Pagar por monta</option>
            <option value="puppies">Distribución por crías</option>
          </select>
        </FormField>
      </div>
      {intention !== 'puppies' && (
        <FormField
          label={intention === 'pay' ? '¿Cuánto ofreces pagar? (COP)' : '¿Cuánto solicitas? (COP)'}
          hint="Es un punto de partida. Las contrapropuestas pueden cambiarlo."
        >
          <input
            name="amount"
            type="number"
            min={1000}
            max={100000000}
            step={1000}
            required
            defaultValue={350000}
          />
        </FormField>
      )}
      <FormField
        label="Cuéntanos cómo es"
        hint="Evita compartir direcciones, teléfonos o información sensible."
      >
        <textarea
          name="bio"
          required
          minLength={20}
          maxLength={1200}
          rows={3}
          placeholder="Su personalidad, sus hábitos y lo que buscas en este proceso…"
        />
      </FormField>
      <label className="checkbox-label">
        <input name="pedigree" type="checkbox" />
        <span>Declaro que tiene pedigree. Entiendo que no se mostrará como verificado.</span>
      </label>
      <label className="checkbox-label">
        <input required type="checkbox" />
        <span>
          Soy su responsable y tengo autorización de quienes participan en las decisiones sobre la
          mascota.
        </span>
      </label>
      <label className="checkbox-label">
        <input required type="checkbox" />
        <span>
          Priorizaré su bienestar y buscaré una valoración veterinaria antes de cualquier cruce.
          Este perfil no acredita aptitud reproductiva.
        </span>
      </label>
      {localError && <p className="form-error">{localError}</p>}
      <Button disabled={busy || !image} type="submit" className="full-width">
        {busy ? 'Guardando…' : 'Publicar su perfil'}
        <PawPrint size={17} />
      </Button>
    </form>
  );
}
function DogDetail({
  dog,
  mine,
  onPropose,
  onFavorite,
  onReport,
}: {
  dog: Dog;
  mine: boolean;
  onPropose: () => void;
  onFavorite: () => void;
  onReport: () => void;
}) {
  return (
    <div className="dog-detail">
      <div className="detail-photo">
        <img src={dog.image} alt={`${dog.name}, ${dog.breed}`} />
        <span className="photo-tag">
          {dog.demo ? 'Perfil de ejemplo' : 'Datos declarados por su responsable'}
        </span>
      </div>
      <div className="detail-body">
        <div className="flex-between">
          <h2>
            {dog.name} <span className={`sex ${dog.sex}`}>{dog.sex === 'female' ? '♀' : '♂'}</span>
          </h2>
          <button className="icon-btn" onClick={onFavorite} aria-label="Guardar favorito">
            <Heart size={22} />
          </button>
        </div>
        <p className="muted">
          {dog.breed} · {dog.age} años
        </p>
        <p className="location">
          <MapPin size={15} />
          {dog.city}, Colombia
        </p>
        <p className="dog-bio">{dog.bio}</p>
        <div className="detail-data">
          <div>
            <span>Responsable</span>
            <b>{dog.ownerName}</b>
          </div>
          <div>
            <span>Identidad</span>
            <b>{dog.demo ? 'Ejemplo ficticio' : 'Sin verificación externa'}</b>
          </div>
          <div>
            <span>Acuerdo inicial</span>
            <b>
              {dog.mode === 'puppies'
                ? 'Por crías'
                : (dog.intention === 'pay' ? 'Ofrece ' : 'Solicita ') + money(dog.amount)}
            </b>
          </div>
          <div>
            <span>Pedigree</span>
            <b>{dog.pedigree ? 'Declarado, sin validar' : 'No declarado'}</b>
          </div>
        </div>
        <div className="info-banner">
          <Shield size={18} />
          <p>
            La información es declarada. Conversa sobre cuidados y solicita una evaluación
            veterinaria antes de continuar.
          </p>
        </div>
        {!mine && (
          <Button className="full-width" onClick={onPropose}>
            {dog.demo ? 'Probar una propuesta de ejemplo' : 'Enviar una propuesta'}
            <ArrowUpRight size={17} />
          </Button>
        )}
        <button className="text-button report-profile" onClick={onReport}>
          <Flag size={13} /> Reportar este perfil
        </button>
      </div>
    </div>
  );
}
function OfferForm({
  initial,
  ownDogs,
  dog,
  proposal,
  dogs,
  busy,
  onSave,
}: {
  initial: Terms;
  ownDogs: Dog[];
  dog?: Dog;
  proposal?: Proposal;
  dogs: Dog[];
  busy: boolean;
  onSave: (terms: Terms, ownDog: string) => Promise<boolean | void>;
}) {
  const [terms, setTerms] = useState<Terms>(structuredClone(initial)),
    [ownDog, setOwnDog] = useState(ownDogs.filter((d) => d.sex !== dog?.sex)[0]?.id || ''),
    [err, setErr] = useState('');
  const requester = proposal
    ? dogs.find((d) => d.id === proposal.requester_dog)?.ownerName || 'Quien solicita'
    : 'Tú';
  const recipient = proposal
    ? dogs.find((d) => d.id === proposal.recipient_dog)?.ownerName || 'Quien recibe'
    : dog?.ownerName || 'La otra persona';
  function update<K extends keyof Terms>(k: K, v: Terms[K]) {
    setTerms((t) => ({ ...t, [k]: v }));
  }
  return (
    <form
      className="stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const { termsSchema } = await import('@/lib/domain');
        const result = termsSchema.safeParse(terms);
        if (!result.success) {
          setErr(result.error.issues.map((i) => i.message).join(' '));
          return;
        }
        setErr('');
        await onSave(result.data, ownDog);
      }}
    >
      <p className="muted">
        Una propuesta abre la conversación. La otra persona puede aceptarla, rechazarla o enviarte
        una nueva versión.
      </p>
      {!proposal && (
        <FormField label={`¿Con quién quieres conectar a ${dog?.name}?`}>
          <select required value={ownDog} onChange={(e) => setOwnDog(e.target.value)}>
            <option value="">Selecciona tu mascota</option>
            {ownDogs
              .filter((d) => d.sex !== dog?.sex)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.breed}
                </option>
              ))}
          </select>
        </FormField>
      )}
      <div className="segmented">
        <button
          className={terms.mode === 'money' ? 'active' : ''}
          type="button"
          onClick={() => update('mode', 'money')}
        >
          <Wallet size={17} /> Acuerdo económico
        </button>
        <button
          className={terms.mode === 'puppies' ? 'active' : ''}
          type="button"
          onClick={() => update('mode', 'puppies')}
        >
          <PawPrint size={17} /> Acuerdo por crías
        </button>
      </div>
      {terms.mode === 'money' ? (
        <div className="offer-money">
          <FormField label="Monto propuesto (COP)">
            <input
              type="number"
              min={1000}
              max={100000000}
              step={1000}
              required
              value={terms.amount}
              onChange={(e) => update('amount', Number(e.target.value))}
            />
          </FormField>
          <FormField label="¿Quién paga a quién?">
            <select
              value={terms.payer}
              onChange={(e) => update('payer', e.target.value as Terms['payer'])}
            >
              <option value="requester">
                Paga {requester} → recibe {recipient}
              </option>
              <option value="recipient">
                Paga {recipient} → recibe {requester}
              </option>
            </select>
          </FormField>
          <p className="muted">
            Este monto corresponde al acuerdo entre las partes. No se cobra al enviar o aceptar. Los
            pagos están pendientes de habilitación.
          </p>
        </div>
      ) : (
        <div className="puppy-editor">
          <p>
            Define cuántas crías recibiría <b>{requester}</b>. Las restantes corresponden a{' '}
            <b>{recipient}</b>. Cubre de 1 a 20 sin huecos.
          </p>
          <div className="rule-presets">
            <span>Empezar con una plantilla:</span>
            <button
              type="button"
              onClick={() => update('rules', structuredClone(defaultTerms.rules))}
            >
              Una cría para quien solicita
            </button>
            <button
              type="button"
              onClick={() =>
                update(
                  'rules',
                  Array.from({ length: 20 }, (_, i) => ({
                    min: i + 1,
                    max: i + 1,
                    requester: Math.floor((i + 1) / 2),
                  })),
                )
              }
            >
              Mitad · impar a quien recibe
            </button>
            <button
              type="button"
              onClick={() =>
                update(
                  'rules',
                  Array.from({ length: 20 }, (_, i) => ({
                    min: i + 1,
                    max: i + 1,
                    requester: Math.ceil((i + 1) / 2),
                  })),
                )
              }
            >
              Mitad · impar a quien solicita
            </button>
          </div>
          <div className="rule-editor-head">
            <span>Desde</span>
            <span>Hasta</span>
            <span>Para {requester}</span>
            <span />
          </div>
          {terms.rules.map((r, i) => (
            <div className="rule-editor-row" key={i}>
              <input
                type="number"
                aria-label={`Desde, regla ${i + 1}`}
                min={1}
                max={20}
                required
                value={r.min}
                onChange={(e) =>
                  update(
                    'rules',
                    terms.rules.map((x, j) =>
                      j === i ? { ...x, min: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
              <input
                type="number"
                aria-label={`Hasta, regla ${i + 1}`}
                min={1}
                max={20}
                required
                value={r.max}
                onChange={(e) =>
                  update(
                    'rules',
                    terms.rules.map((x, j) =>
                      j === i ? { ...x, max: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
              <input
                type="number"
                aria-label={`Crías asignadas, regla ${i + 1}`}
                min={0}
                max={r.min}
                required
                value={r.requester}
                onChange={(e) =>
                  update(
                    'rules',
                    terms.rules.map((x, j) =>
                      j === i ? { ...x, requester: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                aria-label={`Eliminar regla ${i + 1}`}
                className="icon-btn"
                onClick={() =>
                  update(
                    'rules',
                    terms.rules.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => update('rules', [...terms.rules, { min: 1, max: 1, requester: 0 }])}
          >
            <Plus size={14} /> Agregar regla
          </Button>
          <p className="small-note">
            Las reglas son una intención de distribución. Una urgencia, pérdida o cambio en el
            número de crías disponibles exige revisar el plan antes de cualquier entrega.
          </p>
        </div>
      )}
      <div className="form-section-title">
        <ShieldCheck size={19} />
        <h3>Lo importante también se acuerda</h3>
      </div>
      <FormField label="Si alguien cancela">
        <textarea
          required
          minLength={15}
          maxLength={1500}
          rows={3}
          value={terms.cancellation}
          onChange={(e) => update('cancellation', e.target.value)}
        />
      </FormField>
      <FormField label="Si no hay gestación">
        <textarea
          required
          minLength={15}
          maxLength={1500}
          rows={3}
          value={terms.unsuccessful}
          onChange={(e) => update('unsuccessful', e.target.value)}
        />
      </FormField>
      <FormField label="Cuidados, gastos e imprevistos">
        <textarea
          required
          minLength={15}
          maxLength={1500}
          rows={3}
          value={terms.expenses}
          onChange={(e) => update('expenses', e.target.value)}
        />
      </FormField>
      <FormField label="Algo más que deban saber">
        <textarea
          maxLength={2000}
          rows={2}
          value={terms.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Disponibilidad, preguntas o condiciones adicionales…"
        />
      </FormField>
      <label className="checkbox-label">
        <input type="checkbox" required />
        <span>
          He revisado las condiciones. El bienestar tiene prioridad y cualquiera puede detener el
          proceso por una preocupación de salud. No se garantiza gestación ni una camada específica.
        </span>
      </label>
      {err && (
        <p className="form-error" role="alert">
          {err}
        </p>
      )}
      <Button type="submit" className="full-width" disabled={busy || (!proposal && !ownDog)}>
        {busy ? 'Enviando…' : proposal ? 'Enviar contrapropuesta' : 'Enviar propuesta'}
        <Send size={16} />
      </Button>
    </form>
  );
}
function EventForm({
  agreement,
  demo,
  busy,
  onSave,
}: {
  agreement: Agreement;
  demo: boolean;
  actor: string;
  busy: boolean;
  onSave: (data: {
    kind: string;
    note: string;
    dueAt?: string;
    image?: string;
  }) => Promise<boolean | void>;
}) {
  const [open, setOpen] = useState(false),
    [image, setImage] = useState('');
  return open ? (
    <form
      className="stack-form event-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget,
          f = new FormData(form);
        const saved = await onSave({
          kind: String(f.get('kind')),
          note: String(f.get('note')),
          ...(f.get('dueAt')
            ? { dueAt: new Date(String(f.get('dueAt')) + 'T12:00:00-05:00').toISOString() }
            : {}),
          ...(image ? { image } : {}),
        });
        if (saved === false) return;
        form.reset();
        setImage('');
        setOpen(false);
      }}
    >
      <div className="form-grid">
        <FormField label="Tipo de registro">
          <select name="kind">
            {Object.entries(eventLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Fecha relacionada (opcional)">
          <input name="dueAt" type="date" />
        </FormField>
      </div>
      <FormField label="¿Qué quieres dejar registrado?">
        <textarea
          name="note"
          required
          minLength={10}
          maxLength={2000}
          rows={3}
          placeholder="Describe lo sucedido o el próximo paso acordado…"
        />
      </FormField>
      {!demo && <PhotoUpload kind="evidence" agreementId={agreement.id} onUpload={setImage} />}
      <p className="small-note">
        No compartas cédulas, datos biométricos ni información de terceros. El registro no confirma
        por sí solo un encuentro, una gestación o una entrega.
      </p>
      <div className="button-row">
        <Button disabled={busy} type="submit">
          <Plus size={15} /> Guardar registro
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  ) : (
    <Button variant="secondary" onClick={() => setOpen(true)}>
      <Plus size={16} /> Agregar un registro
    </Button>
  );
}
function Security({
  user,
  demo,
  onAuth,
  onRefresh,
  say,
  onLogout,
}: {
  user: User | null;
  demo: boolean;
  onAuth: () => void;
  onRefresh: () => Promise<void>;
  say: (s: string) => void;
  onLogout: () => void;
}) {
  const [qr, setQr] = useState<{ qr: string; secret: string } | null>(null),
    [code, setCode] = useState(''),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState('');
  async function enroll() {
    setBusy(true);
    setErr('');
    try {
      setQr(await api('auth/mfa', 'POST', {}));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="security-grid">
        <section className="panel security-account">
          <div className="section-heading">
            <span className="round-icon">
              <LockKeyhole size={24} />
            </span>
            <span className={`badge ${user?.mfaEnabled ? 'green' : 'neutral'}`}>
              {user?.mfaEnabled ? 'Segundo factor activo' : 'Por completar'}
            </span>
          </div>
          <h2>Un acceso que es solo tuyo</h2>
          <p>
            Usa una app de autenticación para agregar un código temporal a tu contraseña. Se
            requiere para publicar, negociar y registrar evidencias.
          </p>
          {demo ? (
            <div className="info-banner">
              <Sparkles size={19} />
              <p>Estás en una demo. Sal de ella para configurar la seguridad de tu cuenta real.</p>
            </div>
          ) : !user ? (
            <Button onClick={onAuth}>
              Crear mi cuenta <ArrowRight size={16} />
            </Button>
          ) : user.mfaEnabled ? (
            <div className="success-box">
              <CheckCircle2 size={21} />
              <div>
                <b>Tu segundo factor está activo</b>
                <p>
                  Necesitarás un código al volver a iniciar sesión. Conserva acceso a tu
                  autenticador.
                </p>
              </div>
            </div>
          ) : qr ? (
            <div className="mfa-setup">
              <h4>1. Escanea con tu autenticador</h4>
              <img src={qr.qr} alt="Código QR para configurar tu autenticación de dos factores" />
              <p className="small-note">
                Google Authenticator, 1Password u otra app compatible con TOTP.
              </p>
              <details>
                <summary>No puedo escanear el QR</summary>
                <code className="secret-code">{qr.secret}</code>
                <p className="small-note">
                  Guarda esta clave de forma privada. Nunca la compartas.
                </p>
              </details>
              <h4>2. Confirma el código de seis dígitos</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setErr('');
                  try {
                    await api('auth/mfa', 'POST', { code });
                    setQr(null);
                    await onRefresh();
                    say('Segundo factor activado. Ya puedes crear su perfil.');
                  } catch (e) {
                    setErr((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-label="Código de autenticación"
                />
                <Button disabled={busy} type="submit">
                  Activar protección <ShieldCheck size={15} />
                </Button>
              </form>
            </div>
          ) : (
            <Button disabled={busy} onClick={enroll}>
              Activar segundo factor <ShieldCheck size={16} />
            </Button>
          )}
          {err && (
            <p className="form-error" role="alert">
              {err}
            </p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <span className="round-icon">
              <Users size={24} />
            </span>
            <span className="badge neutral">Pendiente de integración</span>
          </div>
          <h2>Identidad con significado</h2>
          <p>
            Verificar quién eres, comprobar tu relación con la mascota y confirmar un encuentro son
            cosas diferentes. Cada una necesita evidencia y un proceso propio.
          </p>
          <div className="identity-list">
            <div>
              <Shield size={18} />
              <span>
                <b>Identidad personal</b>
                <small>No se han conectado proveedores de cédula y validación facial.</small>
              </span>
            </div>
            <div>
              <PawPrint size={18} />
              <span>
                <b>Relación con tu mascota</b>
                <small>
                  Por ahora es una declaración del responsable, sin corroboración externa.
                </small>
              </span>
            </div>
            <div>
              <FileCheck2 size={18} />
              <span>
                <b>Compromiso documentado</b>
                <small>Historial de versiones y copia del acuerdo aceptado.</small>
              </span>
            </div>
          </div>
          <div className="info-banner">
            <Info size={18} />
            <p>No estamos recolectando cédulas ni datos faciales en esta versión.</p>
          </div>
        </section>
      </div>
      <section className="panel">
        <h2>Claridad en cada paso</h2>
        <div className="security-principles">
          <div>
            <Wallet size={23} />
            <h3>Dinero, sin ambigüedades</h3>
            <p>
              No hay pagos activos ni fondos en custodia. La plataforma no mostrará un cobro exitoso
              sin confirmación del proveedor.
            </p>
          </div>
          <div>
            <Eye size={23} />
            <h3>Privacidad por defecto</h3>
            <p>
              El correo de tu cuenta no aparece en los perfiles públicos. Las evidencias del
              seguimiento solo están disponibles para las partes del acuerdo.
            </p>
          </div>
          <div>
            <Heart size={23} />
            <h3>Bienestar primero</h3>
            <p>
              Un acuerdo no garantiza resultados ni sustituye la evaluación de un veterinario. Se
              debe detener el proceso si hay preocupaciones de salud.
            </p>
          </div>
        </div>
      </section>
      {user && !demo && (
        <section className="panel account-panel">
          <div className="flex-between">
            <div>
              <h3>{user.name}</h3>
              <p>
                {user.email} · {user.city}
              </p>
            </div>
            <Button variant="secondary" onClick={onLogout}>
              <LogOut size={16} /> Cerrar sesión
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
function ReportForm({
  subject,
  busy,
  onSave,
}: {
  subject: string;
  busy: boolean;
  onSave: (reason: string) => Promise<boolean | void>;
}) {
  return (
    <form
      className="stack-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(String(new FormData(e.currentTarget).get('reason')));
      }}
    >
      <p className="muted">Referencia: {subject}</p>
      <FormField label="Describe lo que te preocupa">
        <textarea
          name="reason"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="Incluye los detalles que nos ayuden a revisar el caso. Evita datos sensibles innecesarios."
        />
      </FormField>
      <div className="info-banner">
        <Info size={18} />
        <p>
          El reporte quedará guardado para revisión humana. No es un canal de emergencias ni tiene
          un tiempo de respuesta garantizado.
        </p>
      </div>
      <Button type="submit" disabled={busy}>
        Registrar reporte <Flag size={16} />
      </Button>
    </form>
  );
}
function Legal({ page }: { page: 'privacy' | 'terms' }) {
  return (
    <div className="legal-copy">
      <span className="badge neutral">Versión inicial · 1 de noviembre de 2026</span>
      {page === 'privacy' ? (
        <>
          <h3>Qué guardamos</h3>
          <p>
            Los datos que entregas al crear una cuenta, perfiles de mascotas, favoritos, propuestas,
            acuerdos, registros y reportes. Las contraseñas se derivan con scrypt. Las claves del
            segundo factor se cifran en el servidor.
          </p>
          <h3>Qué es público</h3>
          <p>
            El nombre del responsable y la información y fotos publicadas en el perfil de la
            mascota. El correo de la cuenta no es público. Las evidencias adjuntas a un acuerdo
            están restringidas a sus participantes.
          </p>
          <h3>Finalidad</h3>
          <p>
            Operar el acceso, los perfiles, las negociaciones, los acuerdos y el seguimiento
            solicitado. Esta versión no recoge cédulas ni datos faciales y no procesa pagos.
          </p>
          <h3>Conservación y solicitudes</h3>
          <p>
            Los datos se conservan mientras operan la cuenta y el historial del servicio. Puedes
            registrar una solicitud de acceso, corrección o eliminación mediante un reporte. La
            revisión es manual; la gestión de estas solicitudes y la política definitiva deben
            completarse antes del lanzamiento comercial.
          </p>
          <h3>Almacenamiento local</h3>
          <p>
            La sesión utiliza una cookie HttpOnly. El recorrido de demostración guarda sus datos
            ficticios en el almacenamiento de tu navegador. Las imágenes ilustrativas se sirven
            desde el mismo sitio.
          </p>
          <h3>Estado de la plataforma</h3>
          <p>
            Esta es una versión piloto de DOCLOUD. La identificación del operador, los plazos de
            conservación y el proceso formal para ejercer derechos deben definirse antes de recoger
            documentos o activar servicios comerciales.
          </p>
        </>
      ) : (
        <>
          <h3>Qué ofrece esta versión</h3>
          <p>
            Herramientas para publicar perfiles, intercambiar condiciones, conservar acuerdos y
            registrar seguimientos. Solo para personas mayores de edad con autorización para decidir
            sobre la mascota.
          </p>
          <h3>Responsabilidad y bienestar</h3>
          <p>
            La información de los perfiles es declarada por sus responsables. La plataforma no
            certifica salud, propiedad, pedigree, fertilidad, gestación o destino de las crías. Las
            decisiones clínicas corresponden a un veterinario.
          </p>
          <h3>Propuestas y acuerdos</h3>
          <p>
            Cada cambio crea una versión. La aceptación conserva las condiciones exactas y una
            huella digital. Esto no implica firma electrónica certificada, asesoría jurídica ni
            garantía de cumplimiento. Las reglas deben revisarse ante cualquier situación que afecte
            el bienestar.
          </p>
          <h3>Pagos y verificaciones</h3>
          <p>
            No hay pagos, custodia de dinero ni verificación documental o facial habilitados. No se
            cobra por enviar o aceptar propuestas. Los contactos permanecen protegidos hasta
            completar las integraciones y requisitos correspondientes.
          </p>
          <h3>Uso permitido</h3>
          <p>
            No publiques datos falsos, documentos de terceros, información privada sin autorización
            ni contenidos de maltrato. No intentes eludir controles de acceso. Los reportes quedan
            registrados para revisión humana.
          </p>
          <h3>Operación piloto</h3>
          <p>
            La atención de incidencias es manual. Las políticas comerciales, disputas,
            cancelaciones, devoluciones y administración deben completarse antes del lanzamiento
            comercial. Los perfiles de ejemplo y el recorrido demo no constituyen ofertas ni
            contratos reales.
          </p>
        </>
      )}
    </div>
  );
}
