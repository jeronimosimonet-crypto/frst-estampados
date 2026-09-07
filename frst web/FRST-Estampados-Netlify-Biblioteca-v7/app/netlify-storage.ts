import { getStore } from '@netlify/blobs';
import type { DesignFolder, LibraryDesign } from '../lib/library-types';

export type CustomerRecord = {
  id: number;
  name: string;
  businessName: string | null;
  phone: string;
  email: string;
  taxId: string;
  address: string;
  type: string;
  notes: string;
  balance: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductRecord = {
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
  active: boolean;
  createdAt: string;
};

export type OrderRecord = {
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
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecord = {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  note: string;
  createdAt: string;
};

export type VariantRecord = {
  id: number;
  productId: number;
  size: string;
  color: string;
  skuSuffix: string;
  stock: number;
  reserved: number;
  minStock: number;
  active: boolean;
  updatedAt: string;
};

export type OrderItemRecord = {
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
  createdAt: string;
};

export type ApprovalRecord = {
  id: number;
  orderId: number;
  version: number;
  designName: string;
  status: string;
  customerComment: string;
  token: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  customers: CustomerRecord[];
  products: ProductRecord[];
  orders: OrderRecord[];
  payments: PaymentRecord[];
  variants: VariantRecord[];
  orderItems: OrderItemRecord[];
  approvals: ApprovalRecord[];
  designFolders: DesignFolder[];
  designs: LibraryDesign[];
};

const STATE_KEY = 'operaciones-v2-vacia';
const LEGACY_STATE_KEY = 'operaciones-v1';
const STORE_NAME = 'frst-estampados-datos';

function store() {
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

async function removeFictitiousLegacyData(storage: ReturnType<typeof store>) {
  try {
    await storage.delete(LEGACY_STATE_KEY);
  } catch (error) {
    console.warn('No se pudo limpiar la versión anterior de datos', error);
  }
}

function normalizeState(value: Partial<AppState> | null | undefined): AppState {
  return {
    customers: Array.isArray(value?.customers) ? value.customers : [],
    products: Array.isArray(value?.products) ? value.products : [],
    orders: Array.isArray(value?.orders) ? value.orders : [],
    payments: Array.isArray(value?.payments) ? value.payments : [],
    variants: Array.isArray(value?.variants) ? value.variants : [],
    orderItems: Array.isArray(value?.orderItems) ? value.orderItems : [],
    approvals: Array.isArray(value?.approvals) ? value.approvals : [],
    designFolders: Array.isArray(value?.designFolders)
      ? value.designFolders
      : [],
    designs: Array.isArray(value?.designs) ? value.designs : [],
  };
}

export function nextId(rows: { id: number }[]) {
  return rows.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;
}

export async function readState() {
  const storage = store();
  const current = await storage.getWithMetadata(STATE_KEY, {
    type: 'json',
    consistency: 'strong',
  });
  if (current) return normalizeState(current.data as Partial<AppState>);

  await removeFictitiousLegacyData(storage);
  const seeded = createInitialState();
  const created = await storage.setJSON(STATE_KEY, seeded, { onlyIfNew: true });
  if (created.modified) return seeded;
  const winner = await storage.get(STATE_KEY, {
    type: 'json',
    consistency: 'strong',
  });
  return normalizeState(winner as Partial<AppState> | null);
}

export async function mutateState<T>(
  mutate: (state: AppState) => T | Promise<T>,
) {
  const storage = store();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await storage.getWithMetadata(STATE_KEY, {
      type: 'json',
      consistency: 'strong',
    });
    if (!current) await removeFictitiousLegacyData(storage);
    const state = current
      ? normalizeState(current.data as Partial<AppState>)
      : createInitialState();
    const result = await mutate(state);
    const write = await storage.setJSON(
      STATE_KEY,
      state,
      current?.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true },
    );
    if (write.modified) return result;
  }
  throw new Error('No se pudo guardar porque hubo cambios simultáneos.');
}

export function publicState(state: AppState) {
  return {
    customers: state.customers
      .filter((row) => !row.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    orders: state.orders
      .filter((row) => !row.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    products: state.products
      .filter((row) => row.active)
      .sort((a, b) => a.name.localeCompare(b.name)),
    payments: [...state.payments].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    variants: state.variants
      .filter((row) => row.active)
      .sort(
        (a, b) =>
          a.productId - b.productId ||
          a.size.localeCompare(b.size) ||
          a.color.localeCompare(b.color),
      ),
    orderItems: [...state.orderItems].sort(
      (a, b) => a.orderId - b.orderId || a.id - b.id,
    ),
    approvals: [...state.approvals].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    ),
    designFolders: [...state.designFolders].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    designs: [...state.designs].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    ),
  };
}

function createInitialState(): AppState {
  return {
    customers: [],
    products: [],
    orders: [],
    payments: [],
    variants: [],
    orderItems: [],
    approvals: [],
    designFolders: [],
    designs: [],
  };
}
