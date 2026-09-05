import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Falta el archivo' }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return Response.json({ error: 'El archivo supera 20 MB' }, { status: 413 });
  const key = `${user.userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return Response.json({ ok: true, key, name: file.name, size: file.size, type: file.type });
}
