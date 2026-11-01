import { connection } from 'next/server';
import Docloud from '@/components/docloud';
export default async function Page() {
  await connection();
  return <Docloud />;
}
