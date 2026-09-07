import Image from 'next/image';
import { isAdminPasswordConfigured, safeRelativePath } from '@/app/admin-auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returnTo = safeRelativePath(
    typeof params.return_to === 'string' ? params.return_to : '/',
  );
  const hasError = params.error === '1';
  const configured = isAdminPasswordConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-frst.png"
            alt="FRST Estampados"
            width={76}
            height={76}
            className="rounded-2xl bg-zinc-950 object-contain p-1"
            priority
          />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-600">
              Acceso privado
            </p>
            <h1 className="text-2xl font-black text-zinc-950">FRST Estampados</h1>
            <p className="text-sm text-zinc-500">Administrador: Jeronimo Simonet</p>
          </div>
        </div>

        {!configured ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Falta configurar la variable <strong>ADMIN_PASSWORD</strong> en
            Netlify. Debe tener al menos 8 caracteres.
          </div>
        ) : (
          <form action="/api/login" method="post" className="mt-8 space-y-4">
            <input type="hidden" name="return_to" value={returnTo} />
            <label className="block text-sm font-bold text-zinc-700">
              Contraseña de administrador
              <input
                type="password"
                name="password"
                minLength={8}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
              />
            </label>
            {hasError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                La contraseña no es correcta.
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-2xl bg-zinc-950 px-5 py-3 font-black text-white transition hover:bg-pink-600"
            >
              Ingresar al sistema
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
