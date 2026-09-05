import { and, desc, eq } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import {
  customers,
  designApprovals,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  settings,
} from '@/db/schema';

export const dynamic = 'force-dynamic';

const now = () => new Date().toISOString();

async function seedOnce() {
  const db = getDb();
  const seeded = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'starter_seeded'))
    .limit(1);
  if (seeded.length) return;
  const stamp = now();
  await db.insert(customers).values([
    {
      name: 'Club Norte',
      phone: '11 4455-8821',
      email: 'compras@clubnorte.com',
      type: 'Empresa',
      balance: 185000,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      name: 'Micaela Ruiz',
      phone: '11 6430-7721',
      email: 'mica.ruiz@email.com',
      type: 'Particular',
      balance: 0,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      name: 'Estudio Fuego',
      phone: '11 3120-4470',
      email: 'hola@estudiofuego.com',
      type: 'Revendedor',
      balance: 214500,
      createdAt: stamp,
      updatedAt: stamp,
    },
  ]);
  await db.insert(products).values([
    {
      name: 'Remera oversize',
      sku: 'REM-OVER',
      category: 'Prendas',
      sizes: 'XS,S,M,L,XL,2XL,3XL,4XL,5XL',
      colors: 'Negro,Blanco,Crudo',
      cost: 7200,
      price: 16900,
      stock: 34,
      minStock: 18,
      createdAt: stamp,
    },
    {
      name: 'Remera regular',
      sku: 'REM-REG',
      category: 'Prendas',
      sizes: 'XS,S,M,L,XL,2XL,3XL,4XL,5XL',
      colors: 'Negro,Blanco,Gris',
      cost: 5900,
      price: 13900,
      stock: 48,
      minStock: 20,
      createdAt: stamp,
    },
    {
      name: 'Buzo canguro',
      sku: 'BUZ-CANG',
      category: 'Prendas',
      sizes: 'XS,S,M,L,XL,2XL,3XL,4XL,5XL',
      colors: 'Negro,Gris',
      cost: 17200,
      price: 34900,
      stock: 12,
      minStock: 10,
      createdAt: stamp,
    },
    {
      name: 'Taza cerámica',
      sku: 'TAZA-11',
      category: 'Objetos',
      sizes: '11 oz',
      colors: 'Blanco',
      cost: 2400,
      price: 6900,
      stock: 28,
      minStock: 12,
      createdAt: stamp,
    },
    {
      name: 'Gorra trucker',
      sku: 'GOR-TRU',
      category: 'Accesorios',
      sizes: 'Único',
      colors: 'Negro,Blanco,Rojo',
      cost: 4100,
      price: 9900,
      stock: 9,
      minStock: 10,
      createdAt: stamp,
    },
  ]);
  await db.insert(orders).values([
    {
      number: '1048',
      customerId: 1,
      customerName: 'Club Norte',
      items: '24 remeras oversize · Negro · XL',
      total: 405600,
      paid: 220600,
      status: 'En estampado',
      priority: 'Urgente',
      dueDate: '2026-09-03',
      notes: 'Logo frente y espalda',
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      number: '1047',
      customerId: 2,
      customerName: 'Micaela Ruiz',
      items: '8 tazas personalizadas',
      total: 55200,
      paid: 55200,
      status: 'Diseño aprobado',
      priority: 'Normal',
      dueDate: '2026-09-04',
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      number: '1044',
      customerId: 3,
      customerName: 'Estudio Fuego',
      items: '15 buzos canguro · Surtidos',
      total: 523500,
      paid: 309000,
      status: 'Esperando seña',
      priority: 'Normal',
      dueDate: '2026-09-05',
      createdAt: stamp,
      updatedAt: stamp,
    },
  ]);
  await db.insert(settings).values({ key: 'starter_seeded', value: 'true' });
}

async function seedOperationsV2() {
  const db = getDb();
  const seeded = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'operations_v2_seeded'))
    .limit(1);
  if (seeded.length) return;
  const stamp = now();
  await db
    .insert(products)
    .values([
      {
        name: 'Musculosa',
        sku: 'MUS-CLAS',
        category: 'Prendas',
        sizes: 'XS,S,M,L,XL,2XL,3XL,4XL,5XL',
        colors: 'Negro,Blanco',
        cost: 5100,
        price: 12900,
        stock: 18,
        minStock: 10,
        createdAt: stamp,
      },
      {
        name: 'Remera boxy',
        sku: 'REM-BOXY',
        category: 'Prendas',
        sizes: 'XS,S,M,L,XL,2XL,3XL,4XL,5XL',
        colors: 'Negro,Blanco,Crudo',
        cost: 7600,
        price: 17900,
        stock: 22,
        minStock: 12,
        createdAt: stamp,
      },
      {
        name: 'Buzo cuello redondo',
        sku: 'BUZ-RED',
        category: 'Prendas',
        sizes: 'XS,S,M,L,XL,2XL,3XL,4XL,5XL',
        colors: 'Negro,Gris,Crudo',
        cost: 14800,
        price: 30900,
        stock: 14,
        minStock: 9,
        createdAt: stamp,
      },
      {
        name: 'Mate personalizado',
        sku: 'MATE-PER',
        category: 'Objetos',
        sizes: 'Único',
        colors: 'Negro,Blanco,Madera',
        cost: 3600,
        price: 8900,
        stock: 20,
        minStock: 10,
        createdAt: stamp,
      },
    ])
    .onConflictDoNothing();
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.active, true));
  for (const product of productRows) {
    const sizes = product.sizes
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const colors = product.colors
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const combinations = (sizes.length ? sizes : ['Único']).flatMap((size) =>
      (colors.length ? colors : ['Sin color']).map((color) => ({
        size,
        color,
      })),
    );
    const perVariant = combinations.length
      ? Math.floor(product.stock / combinations.length)
      : 0;
    const remainder = combinations.length
      ? product.stock % combinations.length
      : 0;
    if (combinations.length) {
      const values = combinations.map((variant, index) => ({
        productId: product.id,
        size: variant.size,
        color: variant.color,
        skuSuffix: `${variant.size}-${variant.color}`
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-'),
        stock: perVariant + (index < remainder ? 1 : 0),
        minStock: Math.max(
          1,
          Math.ceil(product.minStock / combinations.length),
        ),
        updatedAt: stamp,
      }));
      for (let index = 0; index < values.length; index += 10) {
        await db
          .insert(productVariants)
          .values(values.slice(index, index + 10))
          .onConflictDoNothing();
      }
    }
  }
  const orderRows = await db.select().from(orders);
  for (const order of orderRows) {
    await db
      .insert(designApprovals)
      .values({
        orderId: order.id,
        designName: `Diseño pedido #${order.number}`,
        status: order.status === 'Diseño aprobado' ? 'Aprobado' : 'Pendiente',
        token: crypto.randomUUID(),
        approvedAt: order.status === 'Diseño aprobado' ? stamp : null,
        createdAt: stamp,
        updatedAt: stamp,
      })
      .onConflictDoNothing();
  }
  await db
    .insert(settings)
    .values({ key: 'operations_v2_seeded', value: 'true' });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
  await seedOnce();
  await seedOperationsV2();
  const db = getDb();
  const [
    customerRows,
    orderRows,
    productRows,
    paymentRows,
    variantRows,
    itemRows,
    approvalRows,
  ] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(eq(customers.archived, false))
      .orderBy(desc(customers.updatedAt)),
    db
      .select()
      .from(orders)
      .where(eq(orders.archived, false))
      .orderBy(desc(orders.updatedAt)),
    db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(products.name),
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.active, true))
      .orderBy(
        productVariants.productId,
        productVariants.size,
        productVariants.color,
      ),
    db.select().from(orderItems).orderBy(orderItems.orderId, orderItems.id),
    db.select().from(designApprovals).orderBy(desc(designApprovals.updatedAt)),
  ]);
  return Response.json({
    customers: customerRows,
    orders: orderRows,
    products: productRows,
    payments: paymentRows,
    variants: variantRows,
    orderItems: itemRows,
    approvals: approvalRows,
  });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
  const data = (await request.json()) as Record<string, unknown>;
  const db = getDb();
  const stamp = now();

  if (data.action === 'createCustomer') {
    const name = String(data.name ?? '').trim();
    if (!name)
      return Response.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 },
      );
    const result = await db
      .insert(customers)
      .values({
        name,
        phone: String(data.phone ?? ''),
        email: String(data.email ?? ''),
        taxId: String(data.taxId ?? ''),
        address: String(data.address ?? ''),
        type: String(data.type ?? 'Particular'),
        notes: String(data.notes ?? ''),
        balance: 0,
        createdAt: stamp,
        updatedAt: stamp,
      })
      .returning();
    return Response.json({ ok: true, customer: result[0] });
  }

  if (data.action === 'archiveCustomer') {
    const id = Number(data.id);
    await db
      .update(customers)
      .set({ archived: true, updatedAt: stamp })
      .where(eq(customers.id, id));
    return Response.json({ ok: true });
  }

  if (data.action === 'createProduct') {
    const name = String(data.name ?? '').trim();
    const sku = String(data.sku ?? '')
      .trim()
      .toUpperCase();
    if (!name || !sku)
      return Response.json(
        { error: 'Nombre y SKU son obligatorios' },
        { status: 400 },
      );
    try {
      const sizes = String(data.sizes ?? 'XS,S,M,L,XL,2XL,3XL,4XL,5XL');
      const colors = String(data.colors ?? 'Sin color');
      const initialStock = Math.max(0, Math.round(Number(data.stock ?? 0)));
      const initialMinStock = Math.max(
        0,
        Math.round(Number(data.minStock ?? 0)),
      );
      const result = await db
        .insert(products)
        .values({
          name,
          sku,
          category: String(data.category ?? 'Prendas'),
          sizes,
          colors,
          cost: Math.max(0, Number(data.cost ?? 0)),
          price: Math.max(0, Number(data.price ?? 0)),
          stock: initialStock,
          minStock: initialMinStock,
          createdAt: stamp,
        })
        .returning();
      const sizeValues = sizes
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const colorValues = colors
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const combinations = (sizeValues.length ? sizeValues : ['Único']).flatMap(
        (size) =>
          (colorValues.length ? colorValues : ['Sin color']).map((color) => ({
            size,
            color,
          })),
      );
      if (combinations.length) {
        const perVariant = Math.floor(initialStock / combinations.length);
        const remainder = initialStock % combinations.length;
        const values = combinations.map((variant, index) => ({
          productId: result[0].id,
          size: variant.size,
          color: variant.color,
          skuSuffix: `${variant.size}-${variant.color}`
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-'),
          stock: perVariant + (index < remainder ? 1 : 0),
          minStock: initialMinStock
            ? Math.max(1, Math.ceil(initialMinStock / combinations.length))
            : 0,
          updatedAt: stamp,
        }));
        for (let index = 0; index < values.length; index += 10) {
          await db
            .insert(productVariants)
            .values(values.slice(index, index + 10));
        }
      }
      return Response.json({ ok: true, product: result[0] });
    } catch {
      return Response.json(
        { error: 'El SKU ya existe o los datos no son válidos' },
        { status: 400 },
      );
    }
  }

  if (data.action === 'updateProductStock') {
    const id = Number(data.id);
    const stock = Math.max(0, Number(data.stock ?? 0));
    await db.update(products).set({ stock }).where(eq(products.id, id));
    return Response.json({ ok: true });
  }

  if (data.action === 'updateVariantStock') {
    const id = Number(data.id);
    const stock = Math.max(0, Math.round(Number(data.stock ?? 0)));
    const reserved = Math.min(
      stock,
      Math.max(0, Math.round(Number(data.reserved ?? 0))),
    );
    await db
      .update(productVariants)
      .set({ stock, reserved, updatedAt: stamp })
      .where(eq(productVariants.id, id));
    const variant = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id))
      .limit(1);
    if (variant.length) {
      const siblings = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, variant[0].productId),
            eq(productVariants.active, true),
          ),
        );
      await db
        .update(products)
        .set({ stock: siblings.reduce((sum, row) => sum + row.stock, 0) })
        .where(eq(products.id, variant[0].productId));
    }
    return Response.json({ ok: true });
  }

  if (data.action === 'archiveProduct') {
    await db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, Number(data.id)));
    return Response.json({ ok: true });
  }

  if (data.action === 'createOrder') {
    const customerId = Number(data.customerId);
    const customer = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.archived, false)))
      .limit(1);
    if (!customer.length)
      return Response.json(
        { error: 'Seleccioná un cliente válido' },
        { status: 400 },
      );
    const existingNumbers = await db
      .select({ number: orders.number })
      .from(orders);
    const number = String(
      Math.max(1048, ...existingNumbers.map((row) => Number(row.number) || 0)) +
        1,
    ).padStart(4, '0');
    const rawLines = Array.isArray(data.lines) ? data.lines : [];
    const lines = rawLines
      .map((value) => {
        const line = value as Record<string, unknown>;
        const productId = Number(line.productId);
        return {
          productId,
          size: String(line.size ?? 'Único'),
          color: String(line.color ?? 'Sin color'),
          quantity: Math.max(1, Math.round(Number(line.quantity ?? 1))),
          unitPrice: Math.max(0, Number(line.unitPrice ?? 0)),
          printPosition: String(line.printPosition ?? 'Frente'),
          printWidth: Math.max(0, Number(line.printWidth ?? 0)),
          printHeight: Math.max(0, Number(line.printHeight ?? 0)),
        };
      })
      .filter((line) => Number.isFinite(line.productId) && line.productId > 0);
    if (!lines.length)
      return Response.json(
        { error: 'Agregá al menos un producto al pedido' },
        { status: 400 },
      );
    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.active, true));
    const productMap = new Map(
      productRows.map((product) => [product.id, product]),
    );
    if (lines.some((line) => !productMap.has(line.productId)))
      return Response.json(
        { error: 'Hay un producto inválido en el pedido' },
        { status: 400 },
      );
    const total = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );
    const paid = Math.min(total, Math.max(0, Number(data.paid ?? 0)));
    const summary = lines
      .map(
        (line) =>
          `${line.quantity} ${productMap.get(line.productId)?.name} ${line.size} ${line.color}`,
      )
      .join(' · ');
    const result = await db
      .insert(orders)
      .values({
        number,
        customerId,
        customerName: customer[0].name,
        items: summary,
        total,
        paid,
        status: paid > 0 ? 'Diseño pendiente' : 'Esperando seña',
        priority: String(data.priority ?? 'Normal'),
        dueDate: String(data.dueDate ?? stamp.slice(0, 10)),
        notes: String(data.notes ?? ''),
        createdAt: stamp,
        updatedAt: stamp,
      })
      .returning();
    await db.insert(orderItems).values(
      lines.map((line) => ({
        orderId: result[0].id,
        productId: line.productId,
        productName: productMap.get(line.productId)?.name ?? 'Producto',
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        printPosition: line.printPosition,
        printWidth: line.printWidth,
        printHeight: line.printHeight,
        createdAt: stamp,
      })),
    );
    await db.insert(designApprovals).values({
      orderId: result[0].id,
      designName: `Diseño pedido #${number}`,
      token: crypto.randomUUID(),
      createdAt: stamp,
      updatedAt: stamp,
    });
    await db
      .update(customers)
      .set({ balance: customer[0].balance + (total - paid), updatedAt: stamp })
      .where(eq(customers.id, customerId));
    return Response.json({ ok: true, order: result[0] });
  }

  if (data.action === 'newApprovalVersion') {
    const orderId = Number(data.orderId);
    const latest = await db
      .select()
      .from(designApprovals)
      .where(eq(designApprovals.orderId, orderId))
      .orderBy(desc(designApprovals.version))
      .limit(1);
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order.length)
      return Response.json({ error: 'Pedido inexistente' }, { status: 404 });
    await db.insert(designApprovals).values({
      orderId,
      version: (latest[0]?.version ?? 0) + 1,
      designName: String(
        data.designName ?? `Diseño pedido #${order[0].number}`,
      ),
      token: crypto.randomUUID(),
      createdAt: stamp,
      updatedAt: stamp,
    });
    await db
      .update(orders)
      .set({ status: 'Diseño pendiente', updatedAt: stamp })
      .where(eq(orders.id, orderId));
    return Response.json({ ok: true });
  }

  if (data.action === 'updateOrderStatus') {
    const id = Number(data.id);
    const status = String(data.status ?? 'Consulta');
    await db
      .update(orders)
      .set({ status, updatedAt: stamp })
      .where(eq(orders.id, id));
    return Response.json({ ok: true });
  }

  if (data.action === 'archiveOrder') {
    const id = Number(data.id);
    await db
      .update(orders)
      .set({ archived: true, updatedAt: stamp })
      .where(eq(orders.id, id));
    return Response.json({ ok: true });
  }

  if (data.action === 'registerPayment') {
    const orderId = Number(data.orderId);
    const amount = Math.max(0, Number(data.amount ?? 0));
    const target = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!target.length || !amount)
      return Response.json({ error: 'Pago inválido' }, { status: 400 });
    const applied = Math.min(amount, target[0].total - target[0].paid);
    await db.insert(payments).values({
      orderId,
      amount: applied,
      method: String(data.method ?? 'Transferencia'),
      note: String(data.note ?? ''),
      createdAt: stamp,
    });
    await db
      .update(orders)
      .set({ paid: target[0].paid + applied, updatedAt: stamp })
      .where(eq(orders.id, orderId));
    if (target[0].customerId) {
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, target[0].customerId))
        .limit(1);
      if (customer.length)
        await db
          .update(customers)
          .set({
            balance: Math.max(0, customer[0].balance - applied),
            updatedAt: stamp,
          })
          .where(eq(customers.id, target[0].customerId));
    }
    return Response.json({ ok: true, applied });
  }

  return Response.json({ error: 'Acción desconocida' }, { status: 400 });
}
