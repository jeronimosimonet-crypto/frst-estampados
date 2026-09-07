import { DELETE, GET, POST } from '../../app/api/files/route';

export default async function handler(request: Request) {
  if (request.method === 'GET') return GET(request);
  if (request.method === 'POST') return POST(request);
  if (request.method === 'DELETE') return DELETE(request);
  return Response.json({ error: 'Método no permitido' }, { status: 405 });
}

export const config = { path: '/api/files' };
