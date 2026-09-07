import { GET, POST } from '../../app/api/approval/[token]/route';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const token =
    url.searchParams.get('token') ??
    decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '');
  const context = { params: Promise.resolve({ token }) };
  if (request.method === 'GET') return GET(request, context);
  if (request.method === 'POST') return POST(request, context);
  return Response.json({ error: 'Método no permitido' }, { status: 405 });
}

export const config = { path: '/api/approval/*' };
