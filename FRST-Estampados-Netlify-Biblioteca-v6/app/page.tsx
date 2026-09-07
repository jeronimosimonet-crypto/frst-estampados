import DtfApp from '@/components/dtf-app';
import { requireAdmin } from '@/app/admin-auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await requireAdmin('/');
  return <DtfApp userName="Jeronimo Simonet" />;
}
