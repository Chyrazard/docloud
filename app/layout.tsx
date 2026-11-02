import type { Metadata, Viewport } from 'next';
import './globals.css';
import './brand.css';
import BrandExperience from '@/components/brand/brand-experience';
import { whatsappLink } from '@/lib/support';
export const metadata: Metadata = {
  title: 'DOCLOUD · Buenos encuentros, mejores historias',
  description:
    'Encuentra personas comprometidas, construye acuerdos claros y acompaña cada etapa de la historia de tu perro.',
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg?v=toby-1', apple: '/brand/toby-avatar.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#173e35' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <BrandExperience whatsappUrl={whatsappLink(process.env.WHATSAPP_NUMBER)} />
      </body>
    </html>
  );
}
