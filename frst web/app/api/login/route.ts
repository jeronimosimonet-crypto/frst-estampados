import {
  ADMIN_COOKIE,
  isAdminPasswordConfigured,
  safeRelativePath,
  sessionTokenFor,
} from '../../auth-core';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const form = await request.formData();
  const rawReturnTo = form.get('return_to');
  const rawPassword = form.get('password');
  const returnTo = safeRelativePath(
    typeof rawReturnTo === 'string' ? rawReturnTo : '/',
  );
  const submitted = typeof rawPassword === 'string' ? rawPassword : '';
  const configured = process.env.ADMIN_PASSWORD?.trim() ?? '';

  if (!isAdminPasswordConfigured())
    return Response.redirect(new URL('/ingresar?config=1', request.url), 303);

  const [actual, expected] = await Promise.all([
    sessionTokenFor(submitted),
    sessionTokenFor(configured),
  ]);
  if (actual !== expected)
    return Response.redirect(
      new URL(
        `/ingresar?error=1&return_to=${encodeURIComponent(returnTo)}`,
        request.url,
      ),
      303,
    );

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(returnTo, request.url).toString(),
      'Set-Cookie': `${ADMIN_COOKIE}=${encodeURIComponent(expected)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      'Cache-Control': 'no-store',
    },
  });
}
