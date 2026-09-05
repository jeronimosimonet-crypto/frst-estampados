import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const customers = sqliteTable(
  'customers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    businessName: text('business_name'),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    taxId: text('tax_id').notNull().default(''),
    address: text('address').notNull().default(''),
    type: text('type').notNull().default('Particular'),
    notes: text('notes').notNull().default(''),
    balance: real('balance').notNull().default(0),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_customers_archived_updated').on(table.archived, table.updatedAt),
  ],
);

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    sku: text('sku').notNull().unique(),
    category: text('category').notNull(),
    sizes: text('sizes').notNull().default(''),
    colors: text('colors').notNull().default(''),
    cost: real('cost').notNull().default(0),
    price: real('price').notNull().default(0),
    stock: integer('stock').notNull().default(0),
    minStock: integer('min_stock').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_products_active_name').on(table.active, table.name)],
);

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    number: text('number').notNull().unique(),
    customerId: integer('customer_id').references(() => customers.id),
    customerName: text('customer_name').notNull(),
    items: text('items').notNull(),
    total: real('total').notNull().default(0),
    paid: real('paid').notNull().default(0),
    status: text('status').notNull().default('Consulta'),
    priority: text('priority').notNull().default('Normal'),
    dueDate: text('due_date').notNull(),
    notes: text('notes').notNull().default(''),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_orders_archived_updated').on(table.archived, table.updatedAt),
    index('idx_orders_customer_id').on(table.customerId),
  ],
);

export const payments = sqliteTable(
  'payments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id),
    amount: real('amount').notNull(),
    method: text('method').notNull(),
    note: text('note').notNull().default(''),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_payments_order_created').on(table.orderId, table.createdAt),
  ],
);

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    size: text('size').notNull().default('Único'),
    color: text('color').notNull().default('Sin color'),
    skuSuffix: text('sku_suffix').notNull().default(''),
    stock: integer('stock').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    minStock: integer('min_stock').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_product_variants_product_active').on(
      table.productId,
      table.active,
    ),
    uniqueIndex('uq_product_variants_product_size_color').on(
      table.productId,
      table.size,
      table.color,
    ),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').references(() => products.id),
    productName: text('product_name').notNull(),
    size: text('size').notNull().default('Único'),
    color: text('color').notNull().default('Sin color'),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: real('unit_price').notNull().default(0),
    printPosition: text('print_position').notNull().default('Frente'),
    printWidth: real('print_width').notNull().default(0),
    printHeight: real('print_height').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_order_items_order').on(table.orderId),
    index('idx_order_items_product').on(table.productId),
  ],
);

export const designApprovals = sqliteTable(
  'design_approvals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    designName: text('design_name').notNull().default('Diseño del pedido'),
    status: text('status').notNull().default('Pendiente'),
    customerComment: text('customer_comment').notNull().default(''),
    token: text('token').notNull().unique(),
    approvedAt: text('approved_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_design_approvals_order_updated').on(
      table.orderId,
      table.updatedAt,
    ),
    uniqueIndex('uq_design_approvals_order_version').on(
      table.orderId,
      table.version,
    ),
  ],
);
