'use client';
import { useState } from 'react';
import { PawPrint, Plus, GitBranch, Pencil, Heart, X } from 'lucide-react';
import { allocatePuppies, type Dog, type Terms, type Puppy, type PuppyDraft } from '@/lib/domain';
const statuses = {
  care: 'En cuidado',
  reserved: 'Hogar previsto',
  home: 'Entrega declarada',
  deceased: 'Fallecimiento declarado',
};
export default function FamilyTree({
  parents,
  puppies,
  terms,
  busy,
  onSave,
}: {
  parents: Dog[];
  puppies: Puppy[];
  terms: Terms;
  busy: boolean;
  onSave: (data: PuppyDraft, id?: string, version?: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<Puppy | 'new' | null>(null);
  const item = editing && editing !== 'new' ? editing : null;
  let allocation = '';
  if (puppies.length && terms.mode === 'puppies') {
    try {
      const value = allocatePuppies(terms, puppies.length);
      allocation = `La regla inicial prevé ${value.requester} para quien solicitó y ${value.recipient} para quien recibió. No asigna ni autoriza entregas automáticamente.`;
    } catch {
      allocation = 'Esta cantidad requiere revisar las condiciones del acuerdo.';
    }
  }
  return (
    <section className="panel family-panel">
      <div className="section-heading">
        <div>
          <h2>
            <GitBranch size={21} /> El árbol de su historia
          </h2>
          <p>Nombres, cuidados y un hogar previsto para cada uno.</p>
        </div>
        <button className="text-button" onClick={() => setEditing('new')}>
          <Plus size={14} /> Registrar cría
        </button>
      </div>
      <div className="family-parents">
        {parents.map((p) => (
          <div key={p.id}>
            <img src={p.image} alt={p.name} />
            <b>{p.name}</b>
            <small>{p.sex === 'female' ? 'Madre declarada' : 'Padre declarado'}</small>
          </div>
        ))}
        <span className="family-connection">
          <Heart size={16} />
        </span>
      </div>
      <div className="family-children">
        {puppies.length ? (
          puppies.map((p) => (
            <button
              className={`puppy-card ${p.status === 'deceased' ? 'puppy-memorial' : ''}`}
              key={p.id}
              onClick={() => setEditing(p)}
            >
              <span className="round-icon">
                <PawPrint size={20} />
              </span>
              <b>
                {p.name} <Pencil size={10} />
              </b>
              <small>
                {p.sex === 'unknown'
                  ? 'Sexo por registrar'
                  : p.sex === 'female'
                    ? 'Hembra'
                    : 'Macho'}
              </small>
              <span className="badge neutral">{statuses[p.status]}</span>
              {p.home && <small>Hogar: {p.home}</small>}
            </button>
          ))
        ) : (
          <div className="family-empty">
            <PawPrint size={23} />
            <p>Cuando haya una camada, registra a cada cría y acompaña su historia.</p>
          </div>
        )}
      </div>
      {allocation && <p className="small-note">{allocation}</p>}
      {puppies.some((p) => p.status === 'deceased') && (
        <div className="info-banner">
          <Heart size={18} />
          <p>
            Hay una pérdida registrada. Prioricen el cuidado y revisen la distribución antes de
            continuar.
          </p>
        </div>
      )}
      {editing && (
        <form
          key={typeof editing === 'string' ? editing : editing.id}
          className="stack-form puppy-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const ok = await onSave(
              {
                name: String(f.get('name')),
                sex: String(f.get('sex')) as PuppyDraft['sex'],
                bornAt: String(f.get('bornAt')),
                status: String(f.get('status')) as PuppyDraft['status'],
                home: String(f.get('home')),
                notes: String(f.get('notes')),
              },
              item?.id,
              item?.version,
            );
            if (ok) setEditing(null);
          }}
        >
          <div className="flex-between">
            <h3>{item ? 'Actualizar su historia' : 'Un nuevo nombre en la historia'}</h3>
            <button
              type="button"
              className="icon-btn"
              aria-label="Cerrar registro de cría"
              onClick={() => setEditing(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input
                name="name"
                required
                maxLength={40}
                defaultValue={item?.name}
                placeholder="¿Cómo se llama?"
              />
            </label>
            <label className="field">
              <span>Nacimiento declarado</span>
              <input
                name="bornAt"
                type="date"
                required
                defaultValue={item?.bornAt}
                max={new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })}
              />
            </label>
            <label className="field">
              <span>Sexo</span>
              <select name="sex" defaultValue={item?.sex || 'unknown'}>
                <option value="unknown">Por registrar</option>
                <option value="female">Hembra</option>
                <option value="male">Macho</option>
              </select>
            </label>
            <label className="field">
              <span>Estado declarado</span>
              <select name="status" defaultValue={item?.status || 'care'}>
                {Object.entries(statuses).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Alias del hogar previsto</span>
            <input
              name="home"
              maxLength={120}
              defaultValue={item?.home}
              placeholder="Por ejemplo: familia de Laura, con su autorización"
            />
            <small>Sin dirección, teléfono ni documentos personales.</small>
          </label>
          <label className="field">
            <span>Cuidados y seguimiento</span>
            <textarea
              name="notes"
              maxLength={1000}
              rows={3}
              defaultValue={item?.notes}
              placeholder="Cuidados, próximos pasos y compromiso del hogar…"
            />
          </label>
          <p className="small-note">
            La filiación y el destino son declarados por los participantes. Este árbol no certifica
            parentesco genético, salud ni una entrega verificada.
          </p>
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Guardando…' : 'Guardar su historia'}
            <PawPrint size={15} />
          </button>
        </form>
      )}
    </section>
  );
}
