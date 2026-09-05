'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  Home,
  ImagePlus,
  Layers3,
  Lock,
  Menu,
  MessageCircle,
  PackageCheck,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  Settings,
  Shirt,
  Sparkles,
  TrendingUp,
  Upload,
  Unlock,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Customer = {
  id: number;
  name: string;
  businessName?: string | null;
  phone: string;
  email: string;
  taxId: string;
  address: string;
  type: string;
  notes: string;
  balance: number;
  createdAt: string;
};
type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  sizes: string;
  colors: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
};
type Order = {
  id: number;
  number: string;
  customerId: number | null;
  customerName: string;
  items: string;
  total: number;
  paid: number;
  status: string;
  priority: string;
  dueDate: string;
  notes: string;
  createdAt: string;
};
type Payment = {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  note: string;
  createdAt: string;
};
type ProductVariant = {
  id: number;
  productId: number;
  size: string;
  color: string;
  skuSuffix: string;
  stock: number;
  reserved: number;
  minStock: number;
};
type OrderItem = {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  printPosition: string;
  printWidth: number;
  printHeight: number;
};
type Approval = {
  id: number;
  orderId: number;
  version: number;
  designName: string;
  status: string;
  customerComment: string;
  token: string;
  approvedAt: string | null;
  updatedAt: string;
};
type AppData = {
  customers: Customer[];
  orders: Order[];
  products: Product[];
  payments: Payment[];
  variants: ProductVariant[];
  orderItems: OrderItem[];
  approvals: Approval[];
};
type View =
  | 'Inicio'
  | 'Clientes'
  | 'Pedidos'
  | 'Producción'
  | 'Aprobaciones'
  | 'Armador DTF'
  | 'Productos y stock'
  | 'Caja y comprobantes'
  | 'Herramientas';

const emptyData: AppData = {
  customers: [],
  orders: [],
  products: [],
  payments: [],
  variants: [],
  orderItems: [],
  approvals: [],
};
const statusFlow = [
  'Consulta',
  'Esperando seña',
  'Diseño pendiente',
  'Diseño aprobado',
  'En impresión',
  'En estampado',
  'Control de calidad',
  'Listo para entregar',
  'Entregado',
];
const nav: { label: View; icon: typeof Home }[] = [
  { label: 'Inicio', icon: Home },
  { label: 'Clientes', icon: Users },
  { label: 'Pedidos', icon: PackageCheck },
  { label: 'Producción', icon: Layers3 },
  { label: 'Aprobaciones', icon: FileCheck2 },
  { label: 'Armador DTF', icon: Sparkles },
  { label: 'Productos y stock', icon: Shirt },
  { label: 'Caja y comprobantes', icon: FileText },
  { label: 'Herramientas', icon: WandSparkles },
];

const money = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );

export default function DtfApp({ userName }: { userName: string }) {
  const [active, setActive] = useState<View>('Inicio');
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<
    'customer' | 'order' | 'product' | 'payment' | 'receipt' | 'variants' | null
  >(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) throw new Error('No pudimos cargar la información');
      setData(await response.json());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (payload: Record<string, unknown>, success: string) => {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar');
      await refresh();
      setNotice(success);
      window.setTimeout(() => setNotice(''), 3200);
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    type ToolContext = {
      registerTool: (
        tool: Record<string, unknown>,
        options?: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: 'create_customer',
          title: 'Crear cliente',
          description:
            'Crea un cliente nuevo en FRST Estampados y actualiza la lista visible.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
              type: {
                type: 'string',
                enum: ['Particular', 'Revendedor', 'Empresa', 'Mayorista'],
              },
            },
            required: ['name'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: async (input: unknown) => {
            const value = input as {
              name?: string;
              phone?: string;
              email?: string;
              type?: string;
            };
            if (!value.name?.trim()) throw new Error('name es obligatorio');
            await mutate(
              { action: 'createCustomer', ...value },
              `Cliente ${value.name} agregado`,
            );
            return { status: 'created', name: value.name };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [mutate]);

  const go = (view: View) => {
    setActive(view);
    setMobileNav(false);
  };
  const initials =
    userName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'JS';

  return (
    <main className="min-h-screen bg-background text-foreground">
      {mobileNav && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}
      <Sidebar
        active={active}
        go={go}
        mobileNav={mobileNav}
        ordersCount={data.orders.length}
      />
      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-7">
          <Button
            variant="outline"
            size="icon-lg"
            className="lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </Button>
          <label className="relative hidden max-w-[420px] flex-1 sm:block">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-xl border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Buscar pedido, cliente o producto…"
            />
          </label>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{userName}</p>
              <p className="text-[11px] text-muted-foreground">Administrador</p>
            </div>
            <div className="grid size-10 place-items-center rounded-full bg-[#17211f] text-sm font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        {notice && (
          <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-xl">
            <CheckCircle2 className="size-4" />
            {notice}
          </div>
        )}
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:mx-7">
            <AlertTriangle className="size-4" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => void refresh()}
            >
              Reintentar
            </Button>
          </div>
        )}

        <section className="mx-auto max-w-[1500px] p-4 sm:p-7 xl:p-9">
          {loading ? (
            <LoadingView />
          ) : (
            <>
              {active === 'Inicio' && (
                <Dashboard
                  data={data}
                  onNewOrder={() => setDialog('order')}
                  go={go}
                />
              )}
              {active === 'Clientes' && (
                <CustomersView
                  data={data}
                  onAdd={() => setDialog('customer')}
                  mutate={mutate}
                />
              )}
              {active === 'Pedidos' && (
                <OrdersView
                  data={data}
                  onAdd={() => setDialog('order')}
                  mutate={mutate}
                  openReceipt={(order) => {
                    setSelectedOrder(order);
                    setDialog('receipt');
                  }}
                />
              )}
              {active === 'Producción' && (
                <ProductionView orders={data.orders} mutate={mutate} />
              )}
              {active === 'Aprobaciones' && (
                <ApprovalsView data={data} mutate={mutate} />
              )}
              {active === 'Armador DTF' && <DtfBuilder />}
              {active === 'Productos y stock' && (
                <ProductsView
                  data={data}
                  onAdd={() => setDialog('product')}
                  mutate={mutate}
                  openVariants={(product) => {
                    setSelectedProduct(product);
                    setDialog('variants');
                  }}
                />
              )}
              {active === 'Caja y comprobantes' && (
                <FinanceView
                  data={data}
                  openPayment={(order) => {
                    setSelectedOrder(order);
                    setDialog('payment');
                  }}
                  openReceipt={(order) => {
                    setSelectedOrder(order);
                    setDialog('receipt');
                  }}
                />
              )}
              {active === 'Herramientas' && (
                <ToolsView orders={data.orders} products={data.products} />
              )}
            </>
          )}
        </section>
      </div>

      <CustomerDialog
        open={dialog === 'customer'}
        close={() => setDialog(null)}
        save={mutate}
      />
      <OrderDialog
        open={dialog === 'order'}
        close={() => setDialog(null)}
        save={mutate}
        customers={data.customers}
        products={data.products}
      />
      <ProductDialog
        open={dialog === 'product'}
        close={() => setDialog(null)}
        save={mutate}
      />
      <PaymentDialog
        open={dialog === 'payment'}
        close={() => setDialog(null)}
        save={mutate}
        order={selectedOrder}
      />
      <ReceiptDialog
        open={dialog === 'receipt'}
        close={() => setDialog(null)}
        order={selectedOrder}
        orderItems={data.orderItems.filter(
          (item) => item.orderId === selectedOrder?.id,
        )}
      />
      <VariantsDialog
        open={dialog === 'variants'}
        close={() => setDialog(null)}
        save={mutate}
        product={selectedProduct}
        variants={data.variants.filter(
          (variant) => variant.productId === selectedProduct?.id,
        )}
      />
    </main>
  );
}

function Sidebar({
  active,
  go,
  mobileNav,
  ordersCount,
}: {
  active: View;
  go: (view: View) => void;
  mobileNav: boolean;
  ordersCount: number;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-[72px] items-center gap-3 border-b border-sidebar-border px-6">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#080808] shadow-[0_8px_20px_rgba(13,148,136,.22)]">
          <Image
            src="/logo-frst.png"
            alt="Logo de FRST Estampados"
            width={44}
            height={44}
            className="size-11 object-contain"
            priority
          />
        </div>
        <div>
          <p className="font-heading text-[17px] font-extrabold tracking-[-0.03em]">
            FRST Estampados
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Gestión del taller
          </p>
        </div>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        aria-label="Navegación principal"
      >
        {nav.map((item) => (
          <button
            key={item.label}
            onClick={() => go(item.label)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active === item.label ? 'bg-primary text-primary-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
          >
            <item.icon className="size-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.label === 'Pedidos' && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${active === item.label ? 'bg-white/20' : 'bg-muted'}`}
              >
                {ordersCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-[#e9fbf7] p-4">
        <div className="mb-3 flex items-center justify-between text-xs font-bold text-[#116c61]">
          <span>Meta mensual</span>
          <span>72%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full w-[72%] rounded-full bg-[#12a594]" />
        </div>
        <p className="mt-2 text-xs text-[#47736e]">$2.180.000 de $3.000.000</p>
      </div>
      <button className="m-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-sidebar-accent">
        <Settings className="size-[18px]" /> Configuración
      </button>
    </aside>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-black tracking-[-0.045em] sm:text-[38px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Dashboard({
  data,
  onNewOrder,
  go,
}: {
  data: AppData;
  onNewOrder: () => void;
  go: (view: View) => void;
}) {
  const openOrders = data.orders.filter(
    (order) => order.status !== 'Entregado',
  );
  const owed = data.orders.reduce(
    (sum, order) => sum + order.total - order.paid,
    0,
  );
  const inProduction = data.orders.filter((order) =>
    ['En impresión', 'En estampado', 'Control de calidad'].includes(
      order.status,
    ),
  ).length;
  const urgent = openOrders
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  return (
    <>
      <PageHeader
        eyebrow="Hoy en el taller"
        title="Tu negocio, de un vistazo"
        description="Prioridades, cobros y producción en tiempo real."
        action={
          <Button
            size="lg"
            className="h-11 rounded-xl px-5 font-bold shadow-[0_10px_25px_rgba(13,148,136,.18)]"
            onClick={onNewOrder}
          >
            <Plus />
            Nuevo pedido
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={PackageCheck}
          title="Pedidos activos"
          value={String(openOrders.length)}
          meta={`${openOrders.filter((order) => order.dueDate <= '2026-09-07').length} para esta semana`}
          tint="cyan"
        />
        <Metric
          icon={CircleDollarSign}
          title="Por cobrar"
          value={money(owed)}
          meta={`${data.customers.filter((c) => c.balance > 0).length} clientes con saldo`}
          tint="amber"
        />
        <Metric
          icon={Clock3}
          title="En producción"
          value={String(inProduction)}
          meta="Cola activa del taller"
          tint="violet"
        />
        <Metric
          icon={Layers3}
          title="Aprovechamiento DTF"
          value="84%"
          meta="8,6 m este mes"
          tint="green"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-2xl border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-heading text-lg font-extrabold tracking-tight">
                Pedidos prioritarios
              </h2>
              <p className="text-xs text-muted-foreground">
                Lo que necesita atención primero
              </p>
            </div>
            <button
              onClick={() => go('Pedidos')}
              className="flex items-center gap-1 text-xs font-bold text-primary"
            >
              Ver todos <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="divide-y">
            {urgent.map((order) => (
              <article
                key={order.id}
                className="grid gap-3 px-5 py-4 transition hover:bg-muted/45 sm:grid-cols-[60px_1fr_auto_auto] sm:items-center sm:px-6"
              >
                <span className="text-xs font-black text-muted-foreground">
                  #{order.number}
                </span>
                <div>
                  <p className="text-sm font-extrabold">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.items}</p>
                </div>
                <Status value={order.status} />
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {dateLabel(order.dueDate)}
                </span>
              </article>
            ))}
            {!urgent.length && (
              <EmptyLine text="Todavía no hay pedidos activos." />
            )}
          </div>
        </section>
        <section className="rounded-2xl border bg-[#17211f] p-5 text-white shadow-[0_18px_45px_rgba(20,35,31,.12)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#81d9cd]">
                Producción de hoy
              </p>
              <h2 className="mt-1 font-heading text-xl font-extrabold">
                Capacidad del taller
              </h2>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">
              68%
            </span>
          </div>
          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[68%] rounded-full bg-[#54d5c3]" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <MiniMetric
              value={String(
                data.orders.filter((o) => o.status === 'En impresión').length,
              )}
              label="Imprimir"
            />
            <MiniMetric
              value={String(
                data.orders.filter((o) => o.status === 'En estampado').length,
              )}
              label="Estampar"
            />
            <MiniMetric
              value={String(
                data.orders.filter((o) => o.status === 'Listo para entregar')
                  .length,
              )}
              label="Entregar"
            />
          </div>
          <div className="mt-5 flex gap-3 rounded-xl border border-amber-300/20 bg-amber-200/10 p-3 text-xs text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <p>
              <strong>Atención:</strong>{' '}
              {data.products.filter((p) => p.stock <= p.minStock).length}{' '}
              productos necesitan reposición de stock.
            </p>
          </div>
        </section>
      </div>
      <section className="mt-5 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-extrabold">
              Accesos rápidos
            </h2>
            <p className="text-xs text-muted-foreground">
              Herramientas que te ahorran tiempo
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            icon={Sparkles}
            title="Armar metro DTF"
            meta="58 × 100 cm"
            onClick={() => go('Armador DTF')}
          />
          <QuickAction
            icon={TrendingUp}
            title="Calcular precio"
            meta="Costo, margen y ganancia"
            onClick={() => go('Herramientas')}
          />
          <QuickAction
            icon={QrCode}
            title="Etiquetas QR"
            meta="Identificá cada pedido"
            onClick={() => go('Herramientas')}
          />
          <QuickAction
            icon={MessageCircle}
            title="Mensajes rápidos"
            meta="WhatsApp al cliente"
            onClick={() => go('Herramientas')}
          />
        </div>
      </section>
    </>
  );
}

function CustomersView({
  data,
  onAdd,
  mutate,
}: {
  data: AppData;
  onAdd: () => void;
  mutate: (
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
}) {
  const [query, setQuery] = useState('');
  const filtered = data.customers.filter((c) =>
    `${c.name} ${c.phone} ${c.email}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="Base comercial"
        title="Clientes"
        description="Contactos, historial y saldos, siempre a mano."
        action={
          <Button
            size="lg"
            className="h-11 rounded-xl px-5 font-bold"
            onClick={onAdd}
          >
            <Plus />
            Agregar cliente
          </Button>
        }
      />
      <SearchBox
        value={query}
        setValue={setQuery}
        placeholder="Buscar por nombre, teléfono o email…"
      />
      <section className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/65 text-[11px] uppercase tracking-[.1em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Contacto</th>
                <th className="px-5 py-3">Saldo</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/35">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} />
                      <div>
                        <p className="font-extrabold">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cliente #{customer.id.toString().padStart(3, '0')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p>{customer.phone || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email || 'Sin email'}
                    </p>
                  </td>
                  <td
                    className={`px-5 py-4 font-extrabold ${customer.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
                  >
                    {customer.balance > 0 ? money(customer.balance) : 'Al día'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://wa.me/${customer.phone.replace(/\D/g, '')}`,
                          '_blank',
                        )
                      }
                    >
                      <MessageCircle />
                      WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-1 text-muted-foreground"
                      aria-label="Archivar cliente"
                      onClick={() => {
                        if (confirm(`¿Archivar a ${customer.name}?`))
                          void mutate(
                            { action: 'archiveCustomer', id: customer.id },
                            'Cliente archivado',
                          );
                      }}
                    >
                      <Archive />
                    </Button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5}>
                    <EmptyLine text="No encontramos clientes con esa búsqueda." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function OrdersView({
  data,
  onAdd,
  mutate,
  openReceipt,
}: {
  data: AppData;
  onAdd: () => void;
  mutate: (
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
  openReceipt: (order: Order) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = data.orders.filter((o) =>
    `${o.number} ${o.customerName} ${o.items}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="Flujo completo"
        title="Pedidos"
        description="Desde la seña hasta la entrega, sin perder ningún detalle."
        action={
          <Button
            size="lg"
            className="h-11 rounded-xl px-5 font-bold"
            onClick={onAdd}
          >
            <Plus />
            Nuevo pedido
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchBox
          value={query}
          setValue={setQuery}
          placeholder="Buscar pedido o cliente…"
        />
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 text-xs font-bold text-muted-foreground">
          <span>{filtered.length} pedidos</span>
        </div>
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-muted/65 text-[11px] uppercase tracking-[.1em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Pedido</th>
                <th className="px-5 py-3">Detalle</th>
                <th className="px-5 py-3">Entrega</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Cobro</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-muted/35">
                  <td className="px-5 py-4">
                    <p className="font-black">#{order.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customerName}
                    </p>
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <p className="truncate font-semibold">{order.items}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.orderItems.filter(
                        (item) => item.orderId === order.id,
                      ).length || 1}{' '}
                      renglones · {money(order.total)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{dateLabel(order.dueDate)}</p>
                    <p
                      className={`text-xs ${order.priority === 'Urgente' ? 'font-bold text-red-600' : 'text-muted-foreground'}`}
                    >
                      {order.priority}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <NativeSelect
                      className="w-[168px]"
                      value={order.status}
                      onChange={(event) =>
                        void mutate(
                          {
                            action: 'updateOrderStatus',
                            id: order.id,
                            status: event.target.value,
                          },
                          `Pedido #${order.number} actualizado`,
                        )
                      }
                    >
                      {statusFlow.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </NativeSelect>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-extrabold">{money(order.paid)}</p>
                    <p className="text-xs text-muted-foreground">
                      Saldo {money(order.total - order.paid)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReceipt(order)}
                    >
                      <FileText />
                      Comprobante
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-1 text-muted-foreground"
                      aria-label="Archivar pedido"
                      onClick={() => {
                        if (confirm(`¿Archivar el pedido #${order.number}?`))
                          void mutate(
                            { action: 'archiveOrder', id: order.id },
                            'Pedido archivado',
                          );
                      }}
                    >
                      <Archive />
                    </Button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6}>
                    <EmptyLine text="Todavía no hay pedidos para mostrar." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProductionView({
  orders,
  mutate,
}: {
  orders: Order[];
  mutate: (
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
}) {
  const columns = [
    {
      title: 'Preparar',
      statuses: ['Esperando seña', 'Diseño pendiente', 'Diseño aprobado'],
      color: 'bg-cyan-400',
    },
    { title: 'Imprimir', statuses: ['En impresión'], color: 'bg-violet-400' },
    { title: 'Estampar', statuses: ['En estampado'], color: 'bg-orange-400' },
    {
      title: 'Control y entrega',
      statuses: ['Control de calidad', 'Listo para entregar'],
      color: 'bg-emerald-400',
    },
  ];
  const advance = (order: Order) => {
    const index = statusFlow.indexOf(order.status);
    const next = statusFlow[Math.min(statusFlow.length - 1, index + 1)];
    void mutate(
      { action: 'updateOrderStatus', id: order.id, status: next },
      `Pedido #${order.number}: ${next}`,
    );
  };
  return (
    <>
      <PageHeader
        eyebrow="Tablero visual"
        title="Producción"
        description="Mové cada trabajo por las etapas del taller."
      />
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const items = orders.filter((order) =>
            column.statuses.includes(order.status),
          );
          return (
            <section
              key={column.title}
              className="rounded-2xl border bg-card p-3 shadow-soft"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`size-2.5 rounded-full ${column.color}`} />
                <h2 className="font-extrabold">{column.title}</h2>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-bold">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-xl border bg-background p-4"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-black text-muted-foreground">
                        #{order.number}
                      </span>
                      {order.priority === 'Urgente' && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600">
                          URGENTE
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-extrabold">
                      {order.customerName}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {order.items}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <span className="text-xs font-bold">
                        {dateLabel(order.dueDate)}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advance(order)}
                      >
                        Avanzar <ArrowRight />
                      </Button>
                    </div>
                  </article>
                ))}
                {!items.length && (
                  <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Sin trabajos en esta etapa
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function ApprovalsView({
  data,
  mutate,
}: {
  data: AppData;
  mutate: (
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const latest = data.approvals.filter(
    (approval, index, all) =>
      all.findIndex((candidate) => candidate.orderId === approval.orderId) ===
      index,
  );
  const pending = latest.filter(
    (approval) => approval.status === 'Pendiente',
  ).length;
  const requested = latest.filter(
    (approval) => approval.status === 'Cambios solicitados',
  ).length;
  const copyLink = async (approval: Approval) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/aprobacion/${approval.token}`,
    );
    setCopied(approval.id);
    window.setTimeout(() => setCopied(null), 2200);
  };
  return (
    <>
      <PageHeader
        eyebrow="Validación con clientes"
        title="Aprobaciones de diseño"
        description="Cada pedido tiene un enlace privado para aprobar o pedir cambios antes de imprimir."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MiniCard
          label="Esperando respuesta"
          value={String(pending)}
          icon={Clock3}
          warning
        />
        <MiniCard
          label="Cambios solicitados"
          value={String(requested)}
          icon={RotateCcw}
        />
        <MiniCard
          label="Diseños aprobados"
          value={String(
            latest.filter((approval) => approval.status === 'Aprobado').length,
          )}
          icon={CheckCircle2}
        />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="border-b px-5 py-4">
          <h2 className="font-heading text-lg font-extrabold">
            Enlaces de aprobación
          </h2>
          <p className="text-xs text-muted-foreground">
            Compartilos por WhatsApp; el cliente no necesita iniciar sesión.
          </p>
        </div>
        <div className="divide-y">
          {latest.map((approval) => {
            const order = data.orders.find(
              (item) => item.id === approval.orderId,
            );
            return (
              <article
                key={approval.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[90px_1fr_170px_auto] lg:items-center"
              >
                <div>
                  <p className="text-sm font-black">
                    #{order?.number ?? approval.orderId}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Versión {approval.version}
                  </p>
                </div>
                <div>
                  <p className="font-extrabold">{approval.designName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order?.customerName ?? 'Cliente'}
                    {approval.customerComment
                      ? ` · “${approval.customerComment}”`
                      : ''}
                  </p>
                </div>
                <Status value={approval.status} />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyLink(approval)}
                  >
                    {copied === approval.id ? <CheckCircle2 /> : <FileCheck2 />}
                    {copied === approval.id ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void mutate(
                        {
                          action: 'newApprovalVersion',
                          orderId: approval.orderId,
                          designName: approval.designName,
                        },
                        'Nueva versión creada',
                      )
                    }
                  >
                    <RotateCcw />
                    Nueva versión
                  </Button>
                </div>
              </article>
            );
          })}
          {!latest.length && (
            <EmptyLine text="Todavía no hay diseños para aprobar." />
          )}
        </div>
      </section>
    </>
  );
}

function ProductsView({
  data,
  onAdd,
  mutate,
  openVariants,
}: {
  data: AppData;
  onAdd: () => void;
  mutate: (
    payload: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
  openVariants: (product: Product) => void;
}) {
  const products = data.products;
  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Productos y stock"
        description="Prendas hasta 5XL, objetos e insumos con alertas de reposición."
        action={
          <Button
            size="lg"
            className="h-11 rounded-xl px-5 font-bold"
            onClick={onAdd}
          >
            <Plus />
            Agregar producto
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <MiniCard
          label="Productos activos"
          value={String(products.length)}
          icon={Shirt}
        />
        <MiniCard
          label="Stock crítico"
          value={String(products.filter((p) => p.stock <= p.minStock).length)}
          icon={AlertTriangle}
          warning
        />
        <MiniCard
          label="Valor de inventario"
          value={money(products.reduce((sum, p) => sum + p.stock * p.cost, 0))}
          icon={Boxes}
        />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted/65 text-[11px] uppercase tracking-[.1em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Variantes</th>
                <th className="px-5 py-3">Costo / Precio</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/35">
                  <td className="px-5 py-4">
                    <p className="font-extrabold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} · {product.category}
                    </p>
                  </td>
                  <td className="max-w-[280px] px-5 py-4">
                    <p className="truncate text-xs">
                      <strong>Talles:</strong> {product.sizes || '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      <strong>Colores:</strong> {product.colors || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">
                      {money(product.cost)} / {money(product.price)}
                    </p>
                    <p className="text-xs text-emerald-700">
                      Margen{' '}
                      {product.price
                        ? Math.round((1 - product.cost / product.price) * 100)
                        : 0}
                      %
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <strong
                        className={
                          product.stock <= product.minStock
                            ? 'text-amber-700'
                            : ''
                        }
                      >
                        {product.stock}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        unidades · mín. {product.minStock}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openVariants(product)}
                    >
                      <Boxes />
                      Ver variantes
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-1"
                      aria-label="Archivar producto"
                      onClick={() => {
                        if (confirm(`¿Archivar ${product.name}?`))
                          void mutate(
                            { action: 'archiveProduct', id: product.id },
                            'Producto archivado',
                          );
                      }}
                    >
                      <Archive />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function FinanceView({
  data,
  openPayment,
  openReceipt,
}: {
  data: AppData;
  openPayment: (order: Order) => void;
  openReceipt: (order: Order) => void;
}) {
  const unpaid = data.orders.filter((order) => order.total > order.paid);
  const collected = data.orders.reduce((sum, order) => sum + order.paid, 0);
  const pending = unpaid.reduce(
    (sum, order) => sum + order.total - order.paid,
    0,
  );
  return (
    <>
      <PageHeader
        eyebrow="Caja y documentos"
        title="Cobros y comprobantes"
        description="Señas, pagos parciales y saldos sin cuentas sueltas."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MiniCard
          label="Total cobrado"
          value={money(collected)}
          icon={CircleDollarSign}
        />
        <MiniCard
          label="Pendiente"
          value={money(pending)}
          icon={Clock3}
          warning
        />
        <MiniCard
          label="Pagos registrados"
          value={String(data.payments.length)}
          icon={FileCheck2}
        />
      </div>
      <section className="rounded-2xl border bg-card shadow-soft">
        <div className="border-b px-5 py-4">
          <h2 className="font-heading text-lg font-extrabold">
            Saldos pendientes
          </h2>
          <p className="text-xs text-muted-foreground">
            Registrá un pago o emití un comprobante
          </p>
        </div>
        <div className="divide-y">
          {unpaid.map((order) => (
            <article
              key={order.id}
              className="grid gap-3 px-5 py-4 md:grid-cols-[80px_1fr_auto_auto] md:items-center"
            >
              <p className="text-sm font-black">#{order.number}</p>
              <div>
                <p className="font-extrabold">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  Total {money(order.total)} · Pagado {money(order.paid)}
                </p>
              </div>
              <p className="font-black text-amber-700">
                {money(order.total - order.paid)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReceipt(order)}
                >
                  <FileText />
                  Ver
                </Button>
                <Button size="sm" onClick={() => openPayment(order)}>
                  <Plus />
                  Registrar pago
                </Button>
              </div>
            </article>
          ))}
          {!unpaid.length && (
            <EmptyLine text="Todos los pedidos están pagos." />
          )}
        </div>
      </section>
    </>
  );
}

function ToolsView({
  orders,
  products,
}: {
  orders: Order[];
  products: Product[];
}) {
  const [baseCost, setBaseCost] = useState(7200);
  const [dtfCost, setDtfCost] = useState(1800);
  const [extras, setExtras] = useState(900);
  const [margin, setMargin] = useState(55);
  const totalCost = baseCost + dtfCost + extras;
  const suggested = margin >= 100 ? totalCost : totalCost / (1 - margin / 100);
  const toolCards = [
    {
      icon: Gauge,
      title: 'Planificador de capacidad',
      text: `${orders.filter((o) => o.status !== 'Entregado').length} trabajos activos · 68% de capacidad usada`,
      tone: 'cyan',
    },
    {
      icon: RotateCcw,
      title: 'Control de reimpresiones',
      text: 'Registrá fallas y descubrí dónde se pierde rentabilidad',
      tone: 'violet',
    },
    {
      icon: QrCode,
      title: 'Etiquetas QR',
      text: 'Imprimí etiquetas para bolsas y órdenes de producción',
      tone: 'green',
    },
    {
      icon: AlertTriangle,
      title: 'Reposición inteligente',
      text: `${products.filter((p) => p.stock <= p.minStock).length} productos están en nivel crítico`,
      tone: 'amber',
    },
    {
      icon: MessageCircle,
      title: 'Mensajes de WhatsApp',
      text: 'Presupuesto, seña, aprobación, retiro y postventa',
      tone: 'green',
    },
    {
      icon: FileCheck2,
      title: 'Aprobación de diseños',
      text: 'Guardá la fecha y versión aprobada por el cliente',
      tone: 'cyan',
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Mejorá tu operación"
        title="Centro de herramientas"
        description="Pequeñas automatizaciones para ahorrar tiempo y cuidar el margen."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <span className="metric-icon metric-green">
              <TrendingUp />
            </span>
            <div>
              <h2 className="font-heading text-lg font-extrabold">
                Calculadora de rentabilidad
              </h2>
              <p className="text-xs text-muted-foreground">
                Precio sugerido con margen real
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Producto base"
              value={baseCost}
              setValue={setBaseCost}
            />
            <NumberField
              label="DTF utilizado"
              value={dtfCost}
              setValue={setDtfCost}
            />
            <NumberField
              label="Mano de obra y extras"
              value={extras}
              setValue={setExtras}
            />
            <NumberField
              label="Margen deseado (%)"
              value={margin}
              setValue={setMargin}
            />
          </div>
          <div className="mt-5 rounded-2xl bg-[#17211f] p-5 text-white">
            <p className="text-xs text-white/55">Precio de venta sugerido</p>
            <p className="mt-1 text-3xl font-black">
              {money(Math.ceil(suggested / 100) * 100)}
            </p>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-xs">
              <span className="text-white/55">Costo total</span>
              <strong>{money(totalCost)}</strong>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-white/55">Ganancia estimada</span>
              <strong className="text-[#70e0d0]">
                {money(suggested - totalCost)}
              </strong>
            </div>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          {toolCards.map((tool) => (
            <article
              key={tool.title}
              className="rounded-2xl border bg-card p-5 shadow-soft"
            >
              <span className={`metric-icon metric-${tool.tone}`}>
                <tool.icon />
              </span>
              <h2 className="mt-4 font-extrabold">{tool.title}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {tool.text}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 -ml-2 text-primary"
              >
                Configurar <ChevronRight />
              </Button>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}

type Design = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  quantity: number;
  naturalWidth: number;
  aspectRatio: number;
  lockAspect: boolean;
};
type Placement = { design: Design; copy: number; x: number; y: number };

function DtfBuilder() {
  const [sheetWidth, setSheetWidth] = useState(58);
  const [sheetHeight, setSheetHeight] = useState(100);
  const [gap, setGap] = useState(0.5);
  const [designs, setDesigns] = useState<Design[]>([]);
  const placements = useMemo(() => {
    const result: Placement[] = [];
    let x = 1;
    let y = 1;
    let rowHeight = 0;
    for (const design of designs)
      for (let copy = 0; copy < design.quantity; copy++) {
        if (x + design.width > sheetWidth - 1) {
          x = 1;
          y += rowHeight + gap;
          rowHeight = 0;
        }
        if (y + design.height <= sheetHeight - 1)
          result.push({ design, copy, x, y });
        x += design.width + gap;
        rowHeight = Math.max(rowHeight, design.height);
      }
    return result;
  }, [designs, gap, sheetHeight, sheetWidth]);
  const requested = designs.reduce((sum, d) => sum + d.quantity, 0);
  const usedArea = placements.reduce(
    (sum, p) => sum + p.design.width * p.design.height,
    0,
  );
  const use = Math.min(
    100,
    Math.round((usedArea / (sheetWidth * sheetHeight)) * 100),
  );
  const upload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () =>
        setDesigns((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            name: file.name,
            url,
            width: 18,
            height: Math.max(
              5,
              Math.round(
                ((18 * image.naturalHeight) / image.naturalWidth) * 10,
              ) / 10,
            ),
            quantity: 1,
            naturalWidth: image.naturalWidth,
            aspectRatio: image.naturalWidth / image.naturalHeight,
            lockAspect: true,
          },
        ]);
      image.src = url;
    });
  };
  const update = (id: string, patch: Partial<Design>) =>
    setDesigns((current) =>
      current.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  const updateDesignSize = (
    design: Design,
    dimension: 'width' | 'height',
    value: number,
  ) => {
    const next = Math.max(0.1, value || 0.1);
    const rounded = (number: number) =>
      Math.max(0.1, Math.round(number * 10) / 10);
    if (!design.lockAspect) {
      update(design.id, { [dimension]: rounded(next) });
      return;
    }
    if (dimension === 'width') {
      update(design.id, {
        width: rounded(next),
        height: rounded(next / design.aspectRatio),
      });
    } else {
      update(design.id, {
        height: rounded(next),
        width: rounded(next * design.aspectRatio),
      });
    }
  };
  const toggleAspectRatio = (design: Design) =>
    update(design.id, {
      lockAspect: !design.lockAspect,
      aspectRatio: design.lockAspect
        ? design.aspectRatio
        : design.width / design.height,
    });
  const exportPreview = async () => {
    const lowResolution = designs.some(
      (design) => design.naturalWidth / (design.width / 2.54) < 180,
    );
    if (
      lowResolution &&
      !window.confirm(
        'Hay diseños con menos de 180 DPI estimados. ¿Querés exportar igualmente?',
      )
    )
      return;
    const scale = 300 / 2.54;
    const pixelArea = sheetWidth * scale * sheetHeight * scale;
    if (pixelArea > 150_000_000) {
      alert(
        'El tamaño configurado supera el límite de exportación. Dividí el trabajo en dos metros.',
      );
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sheetWidth * scale);
    canvas.height = Math.round(sheetHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of placements) {
      const image = new Image();
      image.src = p.design.url;
      await image.decode();
      ctx.drawImage(
        image,
        p.x * scale,
        p.y * scale,
        p.design.width * scale,
        p.design.height * scale,
      );
    }
    const link = document.createElement('a');
    link.download = `metro-dtf-${sheetWidth}x${sheetHeight}-300dpi.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  return (
    <>
      <PageHeader
        eyebrow="Armado inteligente"
        title="Armador de metro DTF"
        description="Cargá diseños, definí medidas reales y aprovechá mejor cada centímetro."
        action={
          <Button
            size="lg"
            className="h-11 rounded-xl px-5 font-bold"
            disabled={!placements.length}
            onClick={() => void exportPreview()}
          >
            <Download />
            Exportar PNG
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[330px_1fr_260px]">
        <section className="rounded-2xl border bg-card p-4 shadow-soft">
          <h2 className="font-extrabold">1. Configurá el metro</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField
              label="Ancho (cm)"
              value={sheetWidth}
              setValue={setSheetWidth}
            />
            <NumberField
              label="Alto (cm)"
              value={sheetHeight}
              setValue={setSheetHeight}
            />
            <NumberField
              label="Separación"
              value={gap}
              setValue={setGap}
              step={0.1}
            />
          </div>
          <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/25 bg-primary/[.035] p-4 text-center transition hover:border-primary/60">
            <Upload className="mb-2 size-6 text-primary" />
            <strong className="text-sm">Subir diseños</strong>
            <span className="mt-1 text-xs text-muted-foreground">
              PNG, JPG o WEBP
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => upload(e.target.files)}
            />
          </label>
          <div className="mt-4 space-y-3">
            {designs.map((design) => (
              <article key={design.id} className="rounded-xl border p-3">
                <div className="flex gap-3">
                  <img
                    src={design.url}
                    alt=""
                    className="size-12 rounded-lg bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:10px_10px] object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{design.name}</p>
                    <p
                      className={`text-[10px] ${design.naturalWidth / (design.width / 2.54) < 180 ? 'font-bold text-amber-600' : 'text-emerald-700'}`}
                    >
                      {Math.round(design.naturalWidth / (design.width / 2.54))}{' '}
                      DPI estimados
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-foreground">
                      {design.width.toFixed(1)} × {design.height.toFixed(1)} cm
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setDesigns((current) =>
                        current.filter((d) => d.id !== design.id),
                      )
                    }
                    aria-label="Quitar diseño"
                  >
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">
                      Ancho rápido
                    </span>
                    <NativeSelect
                      className="mt-1 h-8 w-full text-xs"
                      value=""
                      onChange={(event) => {
                        if (event.target.value)
                          updateDesignSize(
                            design,
                            'width',
                            Number(event.target.value),
                          );
                      }}
                    >
                      <option value="">Elegir medida…</option>
                      {[5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40].map(
                        (size) => (
                          <option key={size} value={size}>
                            {size} cm
                          </option>
                        ),
                      )}
                    </NativeSelect>
                  </label>
                  <Button
                    type="button"
                    variant={design.lockAspect ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 shrink-0 px-2 text-[10px]"
                    onClick={() => toggleAspectRatio(design)}
                    title={
                      design.lockAspect
                        ? 'La proporción está bloqueada'
                        : 'Permitir cambios proporcionales'
                    }
                  >
                    {design.lockAspect ? <Lock /> : <Unlock />}
                    {design.lockAspect ? 'Proporción' : 'Libre'}
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <MiniInput
                    label="Ancho (cm)"
                    value={design.width}
                    onChange={(value) =>
                      updateDesignSize(design, 'width', value)
                    }
                  />
                  <MiniInput
                    label="Alto (cm)"
                    value={design.height}
                    onChange={(value) =>
                      updateDesignSize(design, 'height', value)
                    }
                  />
                  <MiniInput
                    label="Copias"
                    value={design.quantity}
                    onChange={(value) =>
                      update(design.id, {
                        quantity: Math.max(1, Math.round(value)),
                      })
                    }
                  />
                </div>
              </article>
            ))}
            {!designs.length && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Todavía no cargaste diseños.
              </p>
            )}
          </div>
        </section>
        <section className="min-h-[680px] overflow-auto rounded-2xl border bg-[#dfe5e3] p-6 shadow-inner">
          <div
            className="relative mx-auto origin-top overflow-hidden border border-dashed border-zinc-400 bg-transparent shadow-xl"
            style={{
              width: Math.min(580, sheetWidth * 10),
              height: Math.min(1000, sheetHeight * 10),
              aspectRatio: `${sheetWidth}/${sheetHeight}`,
              backgroundImage:
                'linear-gradient(#0000000b 1px, transparent 1px), linear-gradient(90deg, #0000000b 1px, transparent 1px)',
              backgroundSize: `${100 / sheetWidth}% ${100 / sheetHeight}%`,
            }}
          >
            {placements.map((p) => (
              <img
                key={`${p.design.id}-${p.copy}`}
                src={p.design.url}
                alt={p.design.name}
                title={`${p.design.name} · ${p.design.width}×${p.design.height} cm`}
                className="absolute object-contain"
                style={{
                  left: `${(p.x / sheetWidth) * 100}%`,
                  top: `${(p.y / sheetHeight) * 100}%`,
                  width: `${(p.design.width / sheetWidth) * 100}%`,
                  height: `${(p.design.height / sheetHeight) * 100}%`,
                }}
              />
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="rounded-2xl bg-[#17211f] p-5 text-white">
            <p className="text-xs text-white/55">Aprovechamiento</p>
            <p className="mt-1 text-4xl font-black">{use}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#54d5c3]"
                style={{ width: `${use}%` }}
              />
            </div>
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-white/55">Piezas ubicadas</span>
                <strong>
                  {placements.length}/{requested}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-white/55">Área del metro</span>
                <strong>
                  {((sheetWidth * sheetHeight) / 10000).toFixed(2)} m²
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-white/55">Desperdicio</span>
                <strong>{100 - use}%</strong>
              </div>
            </div>
          </section>
          {placements.length < requested && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              {requested - placements.length} piezas no entran en el área
              configurada.
            </div>
          )}
          <section className="rounded-2xl border bg-card p-4">
            <h3 className="text-sm font-extrabold">Control de calidad</h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Sin superposiciones
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Margen de seguridad: 1 cm
              </li>
              <li className="flex gap-2">
                <ImagePlus className="size-4 text-primary" />
                Revisá alertas de DPI
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function CustomerDialog({ open, close, save }: DialogProps) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            Agregar cliente
          </DialogTitle>
          <DialogDescription>
            Creá su ficha comercial y empezá a registrar pedidos.
          </DialogDescription>
        </DialogHeader>
        <form
          id="customer-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            try {
              await save(
                { action: 'createCustomer', ...values },
                'Cliente agregado',
              );
              close();
            } catch (e) {
              alert(e instanceof Error ? e.message : 'No se pudo guardar');
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label="Nombre o razón social">
            <Input name="name" required autoFocus />
          </Field>
          <Field label="Tipo">
            <NativeSelect name="type" className="w-full">
              <option>Particular</option>
              <option>Revendedor</option>
              <option>Empresa</option>
              <option>Mayorista</option>
            </NativeSelect>
          </Field>
          <Field label="WhatsApp">
            <Input name="phone" placeholder="11 5555-5555" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" />
          </Field>
          <Field label="DNI / CUIT">
            <Input name="taxId" />
          </Field>
          <Field label="Dirección">
            <Input name="address" />
          </Field>
          <Field label="Notas" wide>
            <Textarea name="notes" />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button form="customer-form" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderDialog({
  open,
  close,
  save,
  customers,
  products,
}: DialogProps & { customers: Customer[]; products: Product[] }) {
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<DraftOrderLine[]>([]);
  const [tomorrow] = useState(() =>
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
  );
  const makeLine = useCallback(
    (product = products[0]): DraftOrderLine => ({
      id: crypto.randomUUID(),
      productId: product?.id ?? 0,
      size: product?.sizes.split(',')[0]?.trim() || 'Único',
      color: product?.colors.split(',')[0]?.trim() || 'Sin color',
      quantity: 1,
      unitPrice: product?.price ?? 0,
      printPosition: 'Frente',
      printWidth: 25,
      printHeight: 30,
    }),
    [products],
  );
  const initialLine: DraftOrderLine | null = products[0]
    ? {
        id: 'initial-line',
        productId: products[0].id,
        size: products[0].sizes.split(',')[0]?.trim() || 'Único',
        color: products[0].colors.split(',')[0]?.trim() || 'Sin color',
        quantity: 1,
        unitPrice: products[0].price,
        printPosition: 'Frente',
        printWidth: 25,
        printHeight: 30,
      }
    : null;
  const visibleLines = lines.length ? lines : initialLine ? [initialLine] : [];
  const total = visibleLines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const updateLine = (id: string, patch: Partial<DraftOrderLine>) =>
    setLines((current) => {
      const source = current.length
        ? current
        : initialLine
          ? [initialLine]
          : [];
      return source.map((line) =>
        line.id === id ? { ...line, ...patch } : line,
      );
    });
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            Nuevo pedido
          </DialogTitle>
          <DialogDescription>
            Detallá productos, talles, colores y ubicación de cada estampa.
          </DialogDescription>
        </DialogHeader>
        <form
          id="order-form"
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            try {
              await save(
                { action: 'createOrder', ...values, lines: visibleLines },
                'Pedido creado con enlace de aprobación',
              );
              setLines([]);
              close();
            } catch (e) {
              alert(e instanceof Error ? e.message : 'No se pudo guardar');
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cliente">
              <NativeSelect name="customerId" className="w-full" required>
                <option value="">Seleccionar cliente…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Fecha de entrega">
              <Input
                name="dueDate"
                type="date"
                defaultValue={tomorrow}
                required
              />
            </Field>
            <Field label="Prioridad">
              <NativeSelect name="priority" className="w-full">
                <option>Normal</option>
                <option>Urgente</option>
              </NativeSelect>
            </Field>
          </div>
          <section className="rounded-2xl border bg-muted/25 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold">Productos del pedido</h3>
                <p className="text-xs text-muted-foreground">
                  Podés mezclar modelos, talles y estampas.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines((current) => [
                    ...(current.length
                      ? current
                      : initialLine
                        ? [initialLine]
                        : []),
                    makeLine(),
                  ])
                }
                disabled={!products.length}
              >
                <Plus />
                Agregar renglón
              </Button>
            </div>
            <div className="space-y-3">
              {visibleLines.map((line, index) => {
                const product =
                  products.find((item) => item.id === line.productId) ??
                  products[0];
                const sizes = product?.sizes
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean) ?? ['Único'];
                const colors = product?.colors
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean) ?? ['Sin color'];
                return (
                  <article
                    key={line.id}
                    className="rounded-xl border bg-card p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black text-muted-foreground">
                        RENGLÓN {index + 1}
                      </p>
                      {visibleLines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Quitar renglón"
                          onClick={() =>
                            setLines(
                              visibleLines.filter(
                                (item) => item.id !== line.id,
                              ),
                            )
                          }
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Producto">
                        <NativeSelect
                          className="w-full"
                          value={line.productId}
                          onChange={(event) => {
                            const next = products.find(
                              (item) => item.id === Number(event.target.value),
                            );
                            if (next)
                              updateLine(line.id, {
                                productId: next.id,
                                size:
                                  next.sizes.split(',')[0]?.trim() || 'Único',
                                color:
                                  next.colors.split(',')[0]?.trim() ||
                                  'Sin color',
                                unitPrice: next.price,
                              });
                          }}
                        >
                          {products.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field label="Talle">
                        <NativeSelect
                          className="w-full"
                          value={line.size}
                          onChange={(event) =>
                            updateLine(line.id, { size: event.target.value })
                          }
                        >
                          {sizes.map((size) => (
                            <option key={size}>{size}</option>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field label="Color">
                        <NativeSelect
                          className="w-full"
                          value={line.color}
                          onChange={(event) =>
                            updateLine(line.id, { color: event.target.value })
                          }
                        >
                          {colors.map((color) => (
                            <option key={color}>{color}</option>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field label="Cantidad">
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(line.id, {
                              quantity: Math.max(1, Number(event.target.value)),
                            })
                          }
                        />
                      </Field>
                      <Field label="Precio unitario">
                        <Input
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={(event) =>
                            updateLine(line.id, {
                              unitPrice: Math.max(
                                0,
                                Number(event.target.value),
                              ),
                            })
                          }
                        />
                      </Field>
                      <Field label="Ubicación">
                        <NativeSelect
                          className="w-full"
                          value={line.printPosition}
                          onChange={(event) =>
                            updateLine(line.id, {
                              printPosition: event.target.value,
                            })
                          }
                        >
                          <option>Frente</option>
                          <option>Espalda</option>
                          <option>Pecho</option>
                          <option>Manga</option>
                          <option>Sin estampa</option>
                        </NativeSelect>
                      </Field>
                      <Field label="Ancho estampa (cm)">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={line.printWidth}
                          onChange={(event) =>
                            updateLine(line.id, {
                              printWidth: Number(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Alto estampa (cm)">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={line.printHeight}
                          onChange={(event) =>
                            updateLine(line.id, {
                              printHeight: Number(event.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>
                  </article>
                );
              })}
              {!products.length && (
                <EmptyLine text="Primero agregá un producto para crear pedidos." />
              )}
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px_180px] sm:items-end">
            <Field label="Notas de producción">
              <Textarea
                name="notes"
                placeholder="Detalles del diseño, terminación u observaciones…"
              />
            </Field>
            <Field label="Seña inicial">
              <Input
                name="paid"
                type="number"
                min="0"
                max={total}
                defaultValue="0"
              />
            </Field>
            <div className="rounded-xl bg-[#17211f] p-4 text-white">
              <p className="text-[10px] uppercase text-white/55">
                Total del pedido
              </p>
              <p className="text-xl font-black">{money(total)}</p>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button
            form="order-form"
            type="submit"
            disabled={saving || !visibleLines.length}
          >
            {saving ? 'Creando…' : 'Crear pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DraftOrderLine = {
  id: string;
  productId: number;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  printPosition: string;
  printWidth: number;
  printHeight: number;
};

function ProductDialog({ open, close, save }: DialogProps) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            Agregar producto
          </DialogTitle>
          <DialogDescription>
            Podés usar todos los talles hasta 5XL o personalizar la lista.
          </DialogDescription>
        </DialogHeader>
        <form
          id="product-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            try {
              await save(
                { action: 'createProduct', ...values },
                'Producto agregado',
              );
              close();
            } catch (e) {
              alert(e instanceof Error ? e.message : 'No se pudo guardar');
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label="Nombre">
            <Input name="name" required />
          </Field>
          <Field label="SKU">
            <Input name="sku" required placeholder="REM-OVER" />
          </Field>
          <Field label="Categoría">
            <NativeSelect name="category" className="w-full">
              <option>Prendas</option>
              <option>Accesorios</option>
              <option>Objetos</option>
              <option>Insumos</option>
            </NativeSelect>
          </Field>
          <Field label="Talles">
            <Input name="sizes" defaultValue="XS,S,M,L,XL,2XL,3XL,4XL,5XL" />
          </Field>
          <Field label="Colores" wide>
            <Input name="colors" placeholder="Negro, Blanco, Crudo" />
          </Field>
          <Field label="Costo">
            <Input name="cost" type="number" min="0" />
          </Field>
          <Field label="Precio">
            <Input name="price" type="number" min="0" />
          </Field>
          <Field label="Stock inicial">
            <Input name="stock" type="number" min="0" />
          </Field>
          <Field label="Stock mínimo">
            <Input name="minStock" type="number" min="0" />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button form="product-form" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VariantsDialog({
  open,
  close,
  save,
  product,
  variants,
}: DialogProps & { product: Product | null; variants: ProductVariant[] }) {
  if (!product) return null;
  const available = variants.reduce(
    (sum, variant) => sum + Math.max(0, variant.stock - variant.reserved),
    0,
  );
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            Stock por talle y color
          </DialogTitle>
          <DialogDescription>
            {product.name} · {product.sku} · {variants.length} variantes ·{' '}
            {available} disponibles
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/65 text-[11px] uppercase tracking-[.1em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Talle</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Stock físico</th>
                <th className="px-4 py-3">Reservado</th>
                <th className="px-4 py-3">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((variant) => (
                <tr key={variant.id}>
                  <td className="px-4 py-3 font-extrabold">{variant.size}</td>
                  <td className="px-4 py-3">{variant.color}</td>
                  <td className="px-4 py-3">
                    <Input
                      aria-label={`Stock ${variant.size} ${variant.color}`}
                      className="h-9 w-24"
                      type="number"
                      min="0"
                      defaultValue={variant.stock}
                      onBlur={(event) => {
                        const stock = Number(event.target.value);
                        if (stock !== variant.stock)
                          void save(
                            {
                              action: 'updateVariantStock',
                              id: variant.id,
                              stock,
                              reserved: variant.reserved,
                            },
                            'Stock de variante actualizado',
                          );
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      aria-label={`Reservado ${variant.size} ${variant.color}`}
                      className="h-9 w-24"
                      type="number"
                      min="0"
                      max={variant.stock}
                      defaultValue={variant.reserved}
                      onBlur={(event) => {
                        const reserved = Number(event.target.value);
                        if (reserved !== variant.reserved)
                          void save(
                            {
                              action: 'updateVariantStock',
                              id: variant.id,
                              stock: variant.stock,
                              reserved,
                            },
                            'Reserva actualizada',
                          );
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${variant.stock - variant.reserved <= variant.minStock ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                      {Math.max(0, variant.stock - variant.reserved)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!variants.length && (
            <EmptyLine text="Este producto todavía no tiene variantes." />
          )}
        </div>
        <DialogFooter>
          <Button onClick={close}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  close,
  save,
  order,
}: DialogProps & { order: Order | null }) {
  const [saving, setSaving] = useState(false);
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            Registrar pago
          </DialogTitle>
          <DialogDescription>
            Pedido #{order.number} · Saldo {money(order.total - order.paid)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="payment-form"
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            try {
              await save(
                { action: 'registerPayment', orderId: order.id, ...values },
                'Pago registrado',
              );
              close();
            } catch (e) {
              alert(e instanceof Error ? e.message : 'No se pudo guardar');
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label="Importe">
            <Input
              name="amount"
              type="number"
              min="1"
              max={order.total - order.paid}
              defaultValue={order.total - order.paid}
              required
            />
          </Field>
          <Field label="Medio de pago">
            <NativeSelect name="method" className="w-full">
              <option>Transferencia</option>
              <option>Efectivo</option>
              <option>Mercado Pago</option>
              <option>Tarjeta</option>
            </NativeSelect>
          </Field>
          <Field label="Nota">
            <Input name="note" placeholder="Referencia opcional" />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button form="payment-form" type="submit" disabled={saving}>
            {saving ? 'Registrando…' : 'Confirmar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDialog({
  open,
  close,
  order,
  orderItems,
}: {
  open: boolean;
  close: () => void;
  order: Order | null;
  orderItems: OrderItem[];
}) {
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-[560px]">
        <div
          id="print-receipt"
          className="rounded-xl border bg-white p-6 text-zinc-900"
        >
          <div className="flex items-start justify-between border-b pb-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center overflow-hidden rounded-full bg-black">
                <Image
                  src="/logo-frst.png"
                  alt="Logo de FRST Estampados"
                  width={48}
                  height={48}
                  className="size-12 object-contain"
                />
              </span>
              <div>
                <h2 className="text-xl font-black">FRST Estampados</h2>
                <p className="text-xs text-zinc-500">Comprobante interno</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">PEDIDO</p>
              <p className="text-xl font-black">#{order.number}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-5 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Cliente</p>
              <p className="font-bold">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Entrega</p>
              <p className="font-bold">{dateLabel(order.dueDate)}</p>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Detalle</p>
            {orderItems.length ? (
              <div className="mt-2 divide-y">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 py-2 text-sm"
                  >
                    <div>
                      <p className="font-bold">
                        {item.quantity} × {item.productName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.size} · {item.color} · {item.printPosition}
                        {item.printWidth > 0
                          ? ` ${item.printWidth}×${item.printHeight} cm`
                          : ''}
                      </p>
                    </div>
                    <strong>{money(item.quantity * item.unitPrice)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 font-semibold">{order.items}</p>
            )}
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total</span>
              <strong>{money(order.total)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pagado</span>
              <strong>{money(order.paid)}</strong>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <span>Saldo</span>
              <strong>{money(order.total - order.paid)}</strong>
            </div>
          </div>
          <p className="mt-6 text-center text-[10px] text-zinc-400">
            Documento interno no válido como factura fiscal.
          </p>
        </div>
        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={close}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer />
            Imprimir / Guardar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DialogProps = {
  open: boolean;
  close: () => void;
  save: (payload: Record<string, unknown>, success: string) => Promise<unknown>;
};
function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`space-y-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function SearchBox({
  value,
  setValue,
  placeholder,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block max-w-[460px] flex-1">
      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-11 rounded-xl bg-card pl-10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function Status({ value }: { value: string }) {
  const tone =
    value.includes('seña') || value.includes('Cambios')
      ? 'amber'
      : value.includes('estampado')
        ? 'violet'
        : value.includes('Listo') ||
            value === 'Entregado' ||
            value === 'Aprobado'
          ? 'green'
          : 'cyan';
  return <span className={`status status-${tone}`}>{value}</span>;
}
function Metric({
  icon: Icon,
  title,
  value,
  meta,
  tint,
}: {
  icon: typeof Home;
  title: string;
  value: string;
  meta: string;
  tint: string;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={`metric-icon metric-${tint}`}>
          <Icon className="size-[19px]" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          En vivo
        </span>
      </div>
      <p className="mt-5 text-xs font-bold text-muted-foreground">{title}</p>
      <p className="mt-1 font-heading text-[28px] font-black tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </article>
  );
}
function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/[.065] px-2 py-3">
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] text-white/55">{label}</p>
    </div>
  );
}
function QuickAction({
  icon: Icon,
  title,
  meta,
  onClick,
}: {
  icon: typeof Home;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-[18px]" />
      </span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="text-[11px] text-muted-foreground">{meta}</span>
      </span>
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </button>
  );
}
function MiniCard({
  label,
  value,
  icon: Icon,
  warning,
}: {
  label: string;
  value: string;
  icon: typeof Home;
  warning?: boolean;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft">
      <span
        className={`grid size-11 place-items-center rounded-xl ${warning ? 'bg-amber-50 text-amber-700' : 'bg-primary/10 text-primary'}`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </article>
  );
}
function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-50 text-xs font-black text-teal-800">
      {name
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}
function EmptyLine({ text }: { text: string }) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">{text}</div>
  );
}
function LoadingView() {
  return (
    <div className="space-y-5">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
function NumberField({
  label,
  value,
  setValue,
  step = 1,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <Input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </label>
  );
}
function MiniInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="text-[9px] font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <Input
        className="mt-1 h-7 px-1.5 text-xs"
        type="number"
        min=".1"
        step=".1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
