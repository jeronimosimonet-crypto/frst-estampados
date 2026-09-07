import { getStore } from '@netlify/blobs';
import { isAdminRequest } from '../../auth-core';

export const dynamic = 'force-dynamic';

const files = () =>
  getStore({ name: 'frst-estampados-archivos', consistency: 'strong' });
const allowedTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

function fileFailure(error: unknown) {
  console.error(error);
  return Response.json(
    { error: 'No se pudo acceder al archivo en Netlify Blobs.' },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request)))
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return Response.json({ error: 'Falta la clave' }, { status: 400 });
  try {
    const stored = await files().getWithMetadata(key, {
      type: 'arrayBuffer',
      consistency: 'strong',
    });
    if (!stored)
      return Response.json({ error: 'Archivo inexistente' }, { status: 404 });
    return new Response(stored.data, {
      headers: {
        'Content-Type':
          typeof stored.metadata.type === 'string'
            ? stored.metadata.type
            : 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(
          typeof stored.metadata.name === 'string'
            ? stored.metadata.name
            : 'archivo',
        )}`,
      },
    });
  } catch (error) {
    return fileFailure(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request)))
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File))
      return Response.json({ error: 'Falta el archivo' }, { status: 400 });
    if (!allowedTypes.has(file.type))
      return Response.json(
        { error: 'Formato no admitido. Usá PNG, JPG, WEBP o PDF.' },
        { status: 415 },
      );
    if (file.size > 20 * 1024 * 1024)
      return Response.json(
        { error: 'El archivo supera 20 MB' },
        { status: 413 },
      );
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${crypto.randomUUID()}-${safeName}`;
    await files().set(key, await file.arrayBuffer(), {
      metadata: { type: file.type, name: file.name, size: file.size },
    });
    return Response.json({
      ok: true,
      key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/api/files?key=${encodeURIComponent(key)}`,
    });
  } catch (error) {
    return fileFailure(error);
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request)))
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return Response.json({ error: 'Falta la clave' }, { status: 400 });
  try {
    await files().delete(key);
    return Response.json({ ok: true });
  } catch (error) {
    return fileFailure(error);
  }
}
