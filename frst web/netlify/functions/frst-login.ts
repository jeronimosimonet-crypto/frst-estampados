import { POST } from '../../app/api/login/route';

export default async function handler(request: Request) {
  if (request.method === 'POST') return POST(request);
  return Response.json({ error: 'Método no permitido' }, { status: 405 });
}

export const config = { path: '/api/login' };
