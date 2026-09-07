import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  isAdminRequest as isAdminWebRequest,
  isAdminPasswordConfigured,
  safeRelativePath,
  sessionTokenFor,
} from './auth-core';

export {
  ADMIN_COOKIE,
  isAdminPasswordConfigured,
  safeRelativePath,
  sessionTokenFor,
};

export async function isAdminRequest(request?: Request) {
  if (request) return isAdminWebRequest(request);
  return isAdminWebRequest(
    new Request('https://frst.local/', { headers: await headers() }),
  );
}

export async function requireAdmin(returnTo = '/') {
  if (await isAdminRequest()) return;
  const safeReturnTo = safeRelativePath(returnTo);
  redirect(`/ingresar?return_to=${encodeURIComponent(safeReturnTo)}`);
}
