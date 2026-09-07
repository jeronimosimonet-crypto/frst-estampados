export async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body) return {} as T;
  try {
    return JSON.parse(body) as T;
  } catch {
    if (response.status === 404 || /^not found/i.test(body.trim()))
      throw new Error(
        'Netlify no encontró el servicio de datos. Volvé a desplegar el ZIP completo del proyecto.',
      );
    throw new Error('El servidor devolvió una respuesta inválida. Intentá nuevamente.');
  }
}
