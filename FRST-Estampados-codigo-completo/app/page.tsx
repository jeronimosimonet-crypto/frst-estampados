import DtfApp from '@/components/dtf-app';
import { requireChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await requireChatGPTUser('/');
  return <DtfApp userName="Jeronimo Simonet" />;
}
