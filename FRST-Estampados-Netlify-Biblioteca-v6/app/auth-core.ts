export const ADMIN_COOKIE = 'frst_admin_session';
const encoder = new TextEncoder();

function configuredPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? '';
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function sessionTokenFor(password: string) {
  return sha256(`frst-estampados:${password}:administrador`);
}

function cookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name)
      return decodeURIComponent(item.slice(separator + 1).trim());
  }
  return null;
}

export function isAdminPasswordConfigured() {
  return configuredPassword().length >= 8;
}

export async function isAdminRequest(request: Request) {
  const password = configuredPassword();
  if (password.length < 8) return false;
  const actual = cookieValue(request.headers.get('cookie'), ADMIN_COOKIE);
  if (!actual) return false;
  return actual === (await sessionTokenFor(password));
}

export function safeRelativePath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const url = new URL(value, 'https://frst.local');
    if (url.origin !== 'https://frst.local') return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
