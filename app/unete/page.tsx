import type { Metadata } from 'next';
import { connection } from 'next/server';
import JoinForm from '@/components/join-form';
import './join.css';
export const metadata: Metadata = {
  title: 'Registra a tu peludo · DOCLOUD',
  description:
    'Cuéntanos de ti y de tu perro. Prepara su preperfil privado en DOCLOUD, sin contraseña y sin costo.',
  openGraph: {
    title: 'Su próxima historia empieza contigo 🐾',
    description:
      'Registra a tu peludo en DOCLOUD. Un primer paso sencillo para encontrar personas comprometidas.',
    url: 'https://dogs.belctech.com/unete',
    images: [{ url: 'https://dogs.belctech.com/images/hero.jpg' }],
  },
  twitter: { card: 'summary_large_image' },
};
export default async function JoinPage() {
  await connection();
  return <JoinForm />;
}
