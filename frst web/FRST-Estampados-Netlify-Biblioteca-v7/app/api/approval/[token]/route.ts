import { mutateState, readState } from '../../../netlify-storage';

export const dynamic = 'force-dynamic';

async function findApproval(token: string) {
  const state = await readState();
  const approval = state.approvals.find((row) => row.token === token);
  if (!approval) return null;
  const order = state.orders.find((row) => row.id === approval.orderId);
  if (!order) return null;
  return {
    id: approval.id,
    orderId: approval.orderId,
    version: approval.version,
    designName: approval.designName,
    status: approval.status,
    customerComment: approval.customerComment,
    approvedAt: approval.approvedAt,
    orderNumber: order.number,
    customerName: order.customerName,
    items: order.items,
    dueDate: order.dueDate,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const approval = await findApproval(token);
    if (!approval)
      return Response.json(
        { error: 'Enlace de aprobación inválido o vencido' },
        { status: 404 },
      );
    return Response.json({ approval });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'No se pudo abrir la aprobación' }, { status: 503 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
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

    const found = await mutateState((state) => {
      const approval = state.approvals.find((row) => row.token === token);
      if (!approval) return false;
      const stamp = new Date().toISOString();
      approval.status = status;
      approval.customerComment = String(payload.comment ?? '').slice(0, 800);
      approval.approvedAt = status === 'Aprobado' ? stamp : null;
      approval.updatedAt = stamp;
      const order = state.orders.find((row) => row.id === approval.orderId);
      if (order) {
        order.status = status === 'Aprobado' ? 'Diseño aprobado' : 'Diseño pendiente';
        order.updatedAt = stamp;
      }
      return true;
    });
    if (!found)
      return Response.json(
        { error: 'Enlace de aprobación inválido o vencido' },
        { status: 404 },
      );
    return Response.json({ ok: true, status });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'No se pudo guardar la aprobación' }, { status: 503 });
  }
}
