import ApprovalPortal from '@/components/approval-portal';

export const dynamic = 'force-dynamic';

export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ApprovalPortal token={token} />;
}
