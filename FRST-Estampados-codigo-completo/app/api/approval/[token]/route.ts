import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { designApprovals, orders } from '@/db/schema';

export const dynamic = 'force-dynamic';

async function findApproval(token: string) {
  const db = getDb();
  return db
    .select({
      id: designApprovals.id,
      orderId: designApprovals.orderId,
      version: designApprovals.version,
      designName: designApprovals.designName,
      status: designApprovals.status,
      customerComment: designApprovals.customerComment,
      approvedAt: designApprovals.approvedAt,
      orderNumber: orders.number,
      customerName: orders.customerName,
      items: orders.items,
      dueDate: orders.dueDate,
    })
    .from(designApprovals)
    .innerJoin(orders, eq(designApprovals.orderId, orders.id))
    .where(eq(designApprovals.token, token))
    .limit(1);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const result = await findApproval(token);
  if (!result.length)
    return Response.json(
      { error: 'Enlace de aprobación inválido o vencido' },
      { status: 404 },
    );
  return Response.json({ approval: result[0] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const current = await findApproval(token);
  if (!current.length)
    return Response.json(
      { error: 'Enlace de aprobación inválido o vencido' },
      { status: 404 },
    );
  const payload = (await request.json()) as {
    decision?: string;
    comment?: string;
  };
  const status =
    payload.decision === 'approve'
      ? 'Aprobado'
      : payload.decision === 'changes'
        ? 'Cambios solicitados'
        : '';
  if (!status)
    return Response.json({ error: 'Decisión inválida' }, { status: 400 });
  const stamp = new Date().toISOString();
  const db = getDb();
  await db
    .update(designApprovals)
    .set({
      status,
      customerComment: String(payload.comment ?? '').slice(0, 800),
      approvedAt: status === 'Aprobado' ? stamp : null,
      updatedAt: stamp,
    })
    .where(eq(designApprovals.id, current[0].id));
  await db
    .update(orders)
    .set({
      status: status === 'Aprobado' ? 'Diseño aprobado' : 'Diseño pendiente',
      updatedAt: stamp,
    })
    .where(eq(orders.id, current[0].orderId));
  return Response.json({ ok: true, status });
}
