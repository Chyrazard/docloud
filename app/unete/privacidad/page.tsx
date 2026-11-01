import { connection } from 'next/server';
import type { Metadata } from 'next';
import IntakePrivacy from '@/components/intake-privacy';
import '../join.css';
export const metadata: Metadata = { title: 'Tus datos y el registro · DOCLOUD' };
export default async function PrivacyPage() {
  await connection();
  return <IntakePrivacy />;
}
