'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ApprovalData = {
  version: number;
  designName: string;
  status: string;
  customerComment: string;
  approvedAt: string | null;
  orderNumber: string;
  customerName: string;
  items: string;
  dueDate: string;
};

export default function ApprovalPortal({ token }: { token: string }) {
  const [approval, setApproval] = useState<ApprovalData | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const response = await fetch(`/api/approval/${token}`, {
      cache: 'no-store',
    });
    const result = (await response.json()) as {
      approval?: ApprovalData;
      error?: string;
    };
    if (!response.ok || !result.approval)
      throw new Error(result.error || 'No se pudo abrir la aprobación');
    setApproval(result.approval);
    setComment(result.approval.customerComment);
  }, [token]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load()
        .catch((cause) =>
          setError(cause instanceof Error ? cause.message : 'Error inesperado'),
        )
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);
  const decide = async (decision: 'approve' | 'changes') => {
    if (decision === 'changes' && !comment.trim()) {
      setError('Contanos qué cambio necesitás.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/approval/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || 'No se pudo registrar la respuesta');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef4f2] p-6">
        <p className="text-sm font-bold text-zinc-500">Abriendo diseño…</p>
      </main>
    );
  if (!approval)
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef4f2] p-6">
        <section className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-xl">
          <AlertTriangle className="mx-auto size-9 text-amber-600" />
          <h1 className="mt-4 text-xl font-black">
            No pudimos abrir este enlace
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
        </section>
      </main>
    );
  const final = approval.status !== 'Pendiente';
  return (
    <main className="min-h-screen bg-[#eef4f2] px-4 py-10 text-zinc-900">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border bg-white shadow-[0_25px_80px_rgba(20,35,31,.13)]">
        <header className="flex items-center gap-3 bg-[#17211f] px-6 py-5 text-white">
          <span className="grid size-12 place-items-center overflow-hidden rounded-full bg-black">
            <Image
              src="/logo-frst.png"
              alt="Logo de FRST Estampados"
              width={48}
              height={48}
              className="size-12 object-contain"
              priority
            />
          </span>
          <div>
            <p className="font-black">FRST Estampados</p>
            <p className="text-xs text-white/55">Aprobación de diseño</p>
          </div>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
            Pedido #{approval.orderNumber}
          </span>
        </header>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-teal-700">
            Versión {approval.version}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Hola, {approval.customerName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Revisá la propuesta de{' '}
            <strong className="text-zinc-800">{approval.designName}</strong>{' '}
            antes de que pase a impresión.
          </p>
          <div className="my-6 rounded-2xl border bg-zinc-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Detalle del pedido
            </p>
            <p className="mt-2 font-bold">{approval.items}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Entrega prevista:{' '}
              {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(
                new Date(`${approval.dueDate}T12:00:00`),
              )}
            </p>
          </div>
          {final ? (
            <div
              className={`rounded-2xl p-6 text-center ${approval.status === 'Aprobado' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
            >
              {approval.status === 'Aprobado' ? (
                <CheckCircle2 className="mx-auto size-10" />
              ) : (
                <RotateCcw className="mx-auto size-10" />
              )}
              <h2 className="mt-3 text-xl font-black">{approval.status}</h2>
              <p className="mt-1 text-sm">
                Tu respuesta quedó registrada. El taller ya puede continuar con
                el pedido.
              </p>
              {approval.customerComment && (
                <p className="mt-4 rounded-xl bg-white/60 p-3 text-sm">
                  “{approval.customerComment}”
                </p>
              )}
            </div>
          ) : (
            <>
              <label className="block" htmlFor="approval-comment">
                <span className="text-xs font-bold text-zinc-500">
                  Comentario opcional al aprobar, obligatorio si pedís cambios
                </span>
                <Textarea
                  id="approval-comment"
                  className="mt-2 min-h-28"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Ej: mover el logo 2 cm hacia arriba…"
                />
              </label>
              {error && (
                <p className="mt-3 text-sm font-bold text-red-600">{error}</p>
              )}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl"
                  disabled={saving}
                  onClick={() => void decide('changes')}
                >
                  <RotateCcw />
                  Pedir cambios
                </Button>
                <Button
                  size="lg"
                  className="h-12 rounded-xl"
                  disabled={saving}
                  onClick={() => void decide('approve')}
                >
                  <CheckCircle2 />
                  Aprobar diseño
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
      <p className="mx-auto mt-5 max-w-2xl text-center text-xs text-zinc-400">
        La aprobación queda registrada con fecha, versión y comentario.
      </p>
    </main>
  );
}
