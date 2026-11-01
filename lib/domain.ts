import { z } from 'zod';
export const puppyRuleSchema = z
  .object({
    min: z.number().int().min(1).max(20),
    max: z.number().int().min(1).max(20),
    requester: z.number().int().min(0).max(20),
  })
  .refine(
    (v) => v.max >= v.min && v.requester <= v.min,
    'La asignación debe ser posible incluso para la camada más pequeña del rango.',
  );
export const termsSchema = z
  .object({
    mode: z.enum(['money', 'puppies']),
    payer: z.enum(['requester', 'recipient']).default('requester'),
    amount: z.number().int().min(0).max(100000000).default(0),
    currency: z.literal('COP').default('COP'),
    rules: z.array(puppyRuleSchema).max(20).default([]),
    cancellation: z.string().trim().min(15).max(1500),
    unsuccessful: z.string().trim().min(15).max(1500),
    expenses: z.string().trim().min(15).max(1500),
    welfare: z.literal(true),
    notes: z.string().trim().max(2000).default(''),
  })
  .superRefine((v, c) => {
    if (v.mode === 'money' && v.amount < 1000)
      c.addIssue({ code: 'custom', message: 'El monto mínimo es $1.000 COP.', path: ['amount'] });
    if (v.mode === 'puppies') {
      if (!v.rules.length)
        c.addIssue({
          code: 'custom',
          message: 'Define las reglas de distribución.',
          path: ['rules'],
        });
      const sorted = [...v.rules].sort((a, b) => a.min - b.min);
      let next = 1;
      for (const r of sorted) {
        if (r.min !== next)
          c.addIssue({
            code: 'custom',
            message: 'Los rangos deben cubrir de 1 a 20 crías sin huecos ni superposiciones.',
            path: ['rules'],
          });
        next = r.max + 1;
      }
      if (next !== 21)
        c.addIssue({
          code: 'custom',
          message:
            'Completa las reglas hasta 20 crías. Para otros tamaños se requiere un nuevo acuerdo.',
          path: ['rules'],
        });
    }
  });
export type Terms = z.infer<typeof termsSchema>;
export const dogSchema = z.object({
  name: z.string().trim().min(2).max(40),
  breed: z.string().trim().min(2).max(70),
  sex: z.enum(['male', 'female']),
  age: z.number().min(0).max(30),
  city: z.string().trim().min(2).max(60),
  bio: z.string().trim().min(20).max(1200),
  image: z.string().max(200),
  pedigree: z.boolean().default(false),
  mode: z.enum(['money', 'puppies']),
  amount: z.number().int().min(0).max(100000000),
  intention: z.enum(['charge', 'pay', 'puppies']),
  guardianConsent: z.literal(true),
  welfareConsent: z.literal(true),
});
export type Dog = z.infer<typeof dogSchema> & {
  id: string;
  ownerId: string;
  ownerName: string;
  demo: boolean;
  createdAt: string;
};
export const defaultTerms: Terms = {
  mode: 'money',
  payer: 'requester',
  amount: 250000,
  currency: 'COP',
  rules: [
    { min: 1, max: 1, requester: 0 },
    { min: 2, max: 2, requester: 1 },
    { min: 3, max: 20, requester: 1 },
  ],
  cancellation:
    'Antes del encuentro, cualquiera puede cancelar. No habrá cargos automáticos; cualquier devolución deberá acordarse y tramitarse con el proveedor de pago.',
  unsuccessful:
    'No se garantiza gestación ni número de crías. No hay repetición automática; cualquier nuevo intento requiere evaluación veterinaria y un nuevo acuerdo.',
  expenses:
    'Cada responsable asume el cuidado de su mascota. Los gastos adicionales y las urgencias requieren un acuerdo explícito; el bienestar tiene prioridad.',
  welfare: true,
  notes: '',
};
export function canRespond(
  actor: string,
  p: { requester_id: string; recipient_id: string; last_by: string; status: string },
  version: number,
  currentVersion: number,
) {
  return (
    [p.requester_id, p.recipient_id].includes(actor) &&
    actor !== p.last_by &&
    p.status === 'pending' &&
    version === currentVersion
  );
}
export function allocatePuppies(terms: Terms, total: number) {
  if (terms.mode !== 'puppies') throw new Error('El acuerdo no distribuye crías.');
  const rule = terms.rules.find((r) => total >= r.min && total <= r.max);
  if (!rule) throw new Error('Este tamaño de camada requiere un nuevo acuerdo.');
  return { requester: rule.requester, recipient: total - rule.requester };
}

export const puppySchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    sex: z.enum(['male', 'female', 'unknown']),
    bornAt: z.iso.date(),
    status: z.enum(['care', 'reserved', 'home', 'deceased']),
    home: z.string().trim().max(120),
    notes: z.string().trim().max(1000),
  })
  .refine(
    (v) => v.status !== 'home' || v.home.length >= 2,
    'Registra un alias del hogar antes de marcar la entrega.',
  );
export type PuppyDraft = z.infer<typeof puppySchema>;
export type Puppy = PuppyDraft & { id: string; version: number };
