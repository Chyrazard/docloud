import { z } from 'zod';
export const INTAKE_CONSENT_VERSION = 'intake-2026-11-01-v1';
export const INTAKE_CONSENT =
  'Autorizo a DOCLOUD a guardar mi nombre, correo, celular y los datos y foto de mi perro para preparar un preperfil privado y contactarme por correo o WhatsApp para completar el registro. Soy mayor de edad y tengo autorización para compartir esta información.';
export const phoneSchema = z
  .string()
  .trim()
  .max(35)
  .transform((v) => v.replace(/[\s().-]/g, ''))
  .transform((v) => (/^\d{10}$/.test(v) ? '+57' + v : v))
  .pipe(
    z
      .string()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        'Escribe un celular con indicativo, por ejemplo +57 300 123 4567.',
      ),
  );
export const intakeSchema = z.object({
  submissionId: z.uuid(),
  name: z.string().trim().min(2, 'Escribe tu nombre.').max(70),
  email: z
    .email('Revisa tu correo electrónico.')
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: phoneSchema,
  dogName: z.string().trim().min(1, 'Escribe el nombre de tu perro.').max(40),
  breed: z.string().trim().min(2, 'Escribe su raza o indica que es mestizo.').max(70),
  age: z.number().min(0).max(30),
  preference: z.enum(['money', 'puppies', 'both']),
  photo: z
    .string()
    .max(7100000)
    .regex(
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
      'Elige una foto JPG, PNG o WebP.',
    ),
  consent: z.literal(true, { error: 'Necesitamos tu autorización para guardar estos datos.' }),
  website: z.string().max(200).optional().default(''),
  source: z.string().trim().max(120).default('direct'),
});
export const privacyRequestSchema = z.object({
  name: z.string().trim().min(2).max(70),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  action: z.enum(['access', 'correct', 'delete']),
  message: z.string().trim().min(10).max(1500),
  consent: z.literal(true),
  website: z.string().max(200).default(''),
});
export type Intake = z.infer<typeof intakeSchema>;
