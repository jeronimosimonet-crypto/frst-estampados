import { isAdminRequest } from '../../auth-core';
import {
  mutateState,
  nextId,
  publicState,
  readState,
  type OrderItemRecord,
} from '../../netlify-storage';

export const dynamic = 'force-dynamic';

const now = () => new Date().toISOString();
const asText = (value: unknown, fallback = '') =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback;
const asNullableId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const asTags = (value: unknown) =>
  (Array.isArray(value) ? value : asText(value).split(','))
    .map((tag) => asText(tag).trim())
    .filter(Boolean)
    .slice(0, 12);

class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json(
    {
      error:
        'No se pudo acceder a los datos. Verificá que Netlify Blobs esté habilitado para este sitio.',
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request)))
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  try {
    return Response.json(publicState(await readState()));
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request)))
    return Response.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const data = (await request.json()) as Record<string, unknown>;
    const stamp = now();

    if (data.action === 'createCustomer') {
      const customer = await mutateState((state) => {
        const name = asText(data.name).trim();
        if (!name) throw new ApiError('El nombre es obligatorio');
        const created = {
          id: nextId(state.customers),
          name,
          businessName: null,
          phone: asText(data.phone),
          email: asText(data.email),
          taxId: asText(data.taxId),
          address: asText(data.address),
          type: asText(data.type, 'Particular'),
          notes: asText(data.notes),
          balance: 0,
          archived: false,
          createdAt: stamp,
          updatedAt: stamp,
        };
        state.customers.push(created);
        return created;
      });
      return Response.json({ ok: true, customer });
    }

    if (data.action === 'createDesignFolder') {
      const folder = await mutateState((state) => {
        const name = asText(data.name).trim().slice(0, 80);
        if (!name) throw new ApiError('El nombre de la carpeta es obligatorio');
        if (
          state.designFolders.some(
            (row) => row.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
          )
        )
          throw new ApiError('Ya existe una carpeta con ese nombre');
        const customerId = asNullableId(data.customerId);
        if (
          customerId &&
          !state.customers.some((row) => row.id === customerId && !row.archived)
        )
          throw new ApiError('El cliente seleccionado no existe');
        const created = {
          id: nextId(state.designFolders),
          name,
          customerId,
          color: asText(data.color, 'teal').slice(0, 24),
          createdAt: stamp,
          updatedAt: stamp,
        };
        state.designFolders.push(created);
        return created;
      });
      return Response.json({ ok: true, folder });
    }

    if (data.action === 'updateDesignFolder') {
      await mutateState((state) => {
        const folder = state.designFolders.find(
          (row) => row.id === Number(data.id),
        );
        if (!folder) throw new ApiError('Carpeta inexistente', 404);
        const name = asText(data.name).trim().slice(0, 80);
        if (!name) throw new ApiError('El nombre de la carpeta es obligatorio');
        if (
          state.designFolders.some(
            (row) =>
              row.id !== folder.id &&
              row.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
          )
        )
          throw new ApiError('Ya existe una carpeta con ese nombre');
        folder.name = name;
        const customerId = asNullableId(data.customerId);
        if (
          customerId &&
          !state.customers.some((row) => row.id === customerId && !row.archived)
        )
          throw new ApiError('El cliente seleccionado no existe');
        folder.customerId = customerId;
        folder.color = asText(data.color, folder.color).slice(0, 24);
        folder.updatedAt = stamp;
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'deleteDesignFolder') {
      await mutateState((state) => {
        const id = Number(data.id);
        if (state.designs.some((row) => row.folderId === id))
          throw new ApiError('La carpeta debe estar vacía antes de eliminarla');
        state.designFolders = state.designFolders.filter(
          (row) => row.id !== id,
        );
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'createDesigns') {
      const created = await mutateState((state) => {
        const rawDesigns = Array.isArray(data.designs) ? data.designs : [];
        if (!rawDesigns.length) throw new ApiError('No se recibieron diseños');
        if (rawDesigns.length > 30)
          throw new ApiError('Podés cargar hasta 30 diseños por vez');
        let id = nextId(state.designs);
        const designs = rawDesigns.map((entry) => {
          const value = entry as Record<string, unknown>;
          const fileKey = asText(value.fileKey).trim();
          const originalName = asText(value.originalName).trim().slice(0, 180);
          const mimeType = asText(value.mimeType).trim();
          if (!fileKey || !originalName)
            throw new ApiError('Faltan datos de uno de los archivos');
          if (
            ![
              'image/png',
              'image/jpeg',
              'image/webp',
              'application/pdf',
            ].includes(mimeType)
          )
            throw new ApiError('Formato de archivo no admitido');
          const folderId = asNullableId(value.folderId);
          const selectedFolder = folderId
            ? state.designFolders.find((row) => row.id === folderId)
            : null;
          if (folderId && !selectedFolder)
            throw new ApiError('La carpeta seleccionada no existe');
          const customerId =
            asNullableId(value.customerId) ??
            selectedFolder?.customerId ??
            null;
          if (
            customerId &&
            !state.customers.some(
              (row) => row.id === customerId && !row.archived,
            )
          )
            throw new ApiError('El cliente seleccionado no existe');
          return {
            id: id++,
            folderId,
            customerId,
            name: asText(value.name, originalName).trim().slice(0, 120),
            originalName,
            fileKey,
            mimeType,
            size: Math.max(0, Number(value.size ?? 0)),
            tags: asTags(value.tags),
            notes: asText(value.notes).trim().slice(0, 1000),
            widthPx: Math.max(0, Math.round(Number(value.widthPx ?? 0))),
            heightPx: Math.max(0, Math.round(Number(value.heightPx ?? 0))),
            createdAt: stamp,
            updatedAt: stamp,
          };
        });
        state.designs.push(...designs);
        return designs;
      });
      return Response.json({ ok: true, designs: created });
    }

    if (data.action === 'updateDesign') {
      await mutateState((state) => {
        const design = state.designs.find((row) => row.id === Number(data.id));
        if (!design) throw new ApiError('Diseño inexistente', 404);
        const name = asText(data.name, design.name).trim().slice(0, 120);
        if (!name) throw new ApiError('El nombre del diseño es obligatorio');
        const folderId = asNullableId(data.folderId);
        const selectedFolder = folderId
          ? state.designFolders.find((row) => row.id === folderId)
          : null;
        if (folderId && !selectedFolder)
          throw new ApiError('La carpeta seleccionada no existe');
        design.name = name;
        design.folderId = folderId;
        const customerId =
          asNullableId(data.customerId) ?? selectedFolder?.customerId ?? null;
        if (
          customerId &&
          !state.customers.some((row) => row.id === customerId && !row.archived)
        )
          throw new ApiError('El cliente seleccionado no existe');
        design.customerId = customerId;
        design.tags = asTags(data.tags);
        design.notes = asText(data.notes).trim().slice(0, 1000);
        design.updatedAt = stamp;
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'deleteDesign') {
      const fileKey = await mutateState((state) => {
        const design = state.designs.find((row) => row.id === Number(data.id));
        if (!design) throw new ApiError('Diseño inexistente', 404);
        state.designs = state.designs.filter((row) => row.id !== design.id);
        return design.fileKey;
      });
      return Response.json({ ok: true, fileKey });
    }

    if (data.action === 'archiveCustomer') {
      await mutateState((state) => {
        const customer = state.customers.find(
          (row) => row.id === Number(data.id),
        );
        if (customer) {
          customer.archived = true;
          customer.updatedAt = stamp;
        }
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'createProduct') {
      const product = await mutateState((state) => {
        const name = asText(data.name).trim();
        const sku = asText(data.sku).trim().toUpperCase();
        if (!name || !sku) throw new ApiError('Nombre y SKU son obligatorios');
        if (state.products.some((row) => row.sku === sku))
          throw new ApiError('El SKU ya existe o los datos no son válidos');
        const sizes = asText(data.sizes, 'XS,S,M,L,XL,2XL,3XL,4XL,5XL');
        const colors = asText(data.colors, 'Sin color');
        const stock = Math.max(0, Math.round(Number(data.stock ?? 0)));
        const minStock = Math.max(0, Math.round(Number(data.minStock ?? 0)));
        const created = {
          id: nextId(state.products),
          name,
          sku,
          category: asText(data.category, 'Prendas'),
          sizes,
          colors,
          cost: Math.max(0, Number(data.cost ?? 0)),
          price: Math.max(0, Number(data.price ?? 0)),
          stock,
          minStock,
          active: true,
          createdAt: stamp,
        };
        state.products.push(created);
        const sizeValues = sizes
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const colorValues = colors
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const combinations = (
          sizeValues.length ? sizeValues : ['Único']
        ).flatMap((size) =>
          (colorValues.length ? colorValues : ['Sin color']).map((color) => ({
            size,
            color,
          })),
        );
        const perVariant = Math.floor(stock / combinations.length);
        const remainder = stock % combinations.length;
        let id = nextId(state.variants);
        combinations.forEach((variant, index) => {
          state.variants.push({
            id: id++,
            productId: created.id,
            size: variant.size,
            color: variant.color,
            skuSuffix: `${variant.size}-${variant.color}`
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, '-'),
            stock: perVariant + (index < remainder ? 1 : 0),
            reserved: 0,
            minStock: minStock
              ? Math.max(1, Math.ceil(minStock / combinations.length))
              : 0,
            active: true,
            updatedAt: stamp,
          });
        });
        return created;
      });
      return Response.json({ ok: true, product });
    }

    if (data.action === 'updateProductStock') {
      await mutateState((state) => {
        const product = state.products.find(
          (row) => row.id === Number(data.id),
        );
        if (product) product.stock = Math.max(0, Number(data.stock ?? 0));
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'updateVariantStock') {
      await mutateState((state) => {
        const variant = state.variants.find(
          (row) => row.id === Number(data.id),
        );
        if (!variant) return;
        variant.stock = Math.max(0, Math.round(Number(data.stock ?? 0)));
        variant.reserved = Math.min(
          variant.stock,
          Math.max(0, Math.round(Number(data.reserved ?? 0))),
        );
        variant.updatedAt = stamp;
        const product = state.products.find(
          (row) => row.id === variant.productId,
        );
        if (product)
          product.stock = state.variants
            .filter((row) => row.productId === variant.productId && row.active)
            .reduce((sum, row) => sum + row.stock, 0);
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'archiveProduct') {
      await mutateState((state) => {
        const id = Number(data.id);
        const product = state.products.find((row) => row.id === id);
        if (product) product.active = false;
        state.variants
          .filter((row) => row.productId === id)
          .forEach((row) => {
            row.active = false;
            row.updatedAt = stamp;
          });
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'createOrder') {
      const order = await mutateState((state) => {
        const customerId = Number(data.customerId);
        const customer = state.customers.find(
          (row) => row.id === customerId && !row.archived,
        );
        if (!customer) throw new ApiError('Seleccioná un cliente válido');
        const rawLines = Array.isArray(data.lines) ? data.lines : [];
        const lines = rawLines
          .map((value) => {
            const line = value as Record<string, unknown>;
            return {
              productId: Number(line.productId),
              size: asText(line.size, 'Único'),
              color: asText(line.color, 'Sin color'),
              quantity: Math.max(1, Math.round(Number(line.quantity ?? 1))),
              unitPrice: Math.max(0, Number(line.unitPrice ?? 0)),
              printPosition: asText(line.printPosition, 'Frente'),
              printWidth: Math.max(0, Number(line.printWidth ?? 0)),
              printHeight: Math.max(0, Number(line.printHeight ?? 0)),
            };
          })
          .filter(
            (line) => Number.isFinite(line.productId) && line.productId > 0,
          );
        if (!lines.length)
          throw new ApiError('Agregá al menos un producto al pedido');
        if (
          lines.some(
            (line) =>
              !state.products.some(
                (product) => product.id === line.productId && product.active,
              ),
          )
        )
          throw new ApiError('Hay un producto inválido en el pedido');
        const number = String(
          Math.max(0, ...state.orders.map((row) => Number(row.number) || 0)) +
            1,
        ).padStart(4, '0');
        const total = lines.reduce(
          (sum, line) => sum + line.quantity * line.unitPrice,
          0,
        );
        const paid = Math.min(total, Math.max(0, Number(data.paid ?? 0)));
        const productMap = new Map(
          state.products.map((product) => [product.id, product]),
        );
        const created = {
          id: nextId(state.orders),
          number,
          customerId,
          customerName: customer.name,
          items: lines
            .map(
              (line) =>
                `${line.quantity} ${productMap.get(line.productId)?.name} ${line.size} ${line.color}`,
            )
            .join(' · '),
          total,
          paid,
          status: paid > 0 ? 'Diseño pendiente' : 'Esperando seña',
          priority: asText(data.priority, 'Normal'),
          dueDate: asText(data.dueDate, stamp.slice(0, 10)),
          notes: asText(data.notes),
          archived: false,
          createdAt: stamp,
          updatedAt: stamp,
        };
        state.orders.push(created);
        let itemId = nextId(state.orderItems);
        state.orderItems.push(
          ...lines.map(
            (line): OrderItemRecord => ({
              id: itemId++,
              orderId: created.id,
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
            }),
          ),
        );
        state.approvals.push({
          id: nextId(state.approvals),
          orderId: created.id,
          version: 1,
          designName: `Diseño pedido #${number}`,
          status: 'Pendiente',
          customerComment: '',
          token: crypto.randomUUID(),
          approvedAt: null,
          createdAt: stamp,
          updatedAt: stamp,
        });
        customer.balance += total - paid;
        customer.updatedAt = stamp;
        return created;
      });
      return Response.json({ ok: true, order });
    }

    if (data.action === 'newApprovalVersion') {
      await mutateState((state) => {
        const orderId = Number(data.orderId);
        const order = state.orders.find((row) => row.id === orderId);
        if (!order) throw new ApiError('Pedido inexistente', 404);
        const version =
          Math.max(
            0,
            ...state.approvals
              .filter((row) => row.orderId === orderId)
              .map((row) => row.version),
          ) + 1;
        state.approvals.push({
          id: nextId(state.approvals),
          orderId,
          version,
          designName: asText(data.designName, `Diseño pedido #${order.number}`),
          status: 'Pendiente',
          customerComment: '',
          token: crypto.randomUUID(),
          approvedAt: null,
          createdAt: stamp,
          updatedAt: stamp,
        });
        order.status = 'Diseño pendiente';
        order.updatedAt = stamp;
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'updateOrderStatus') {
      await mutateState((state) => {
        const order = state.orders.find((row) => row.id === Number(data.id));
        if (order) {
          order.status = asText(data.status, 'Consulta');
          order.updatedAt = stamp;
        }
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'archiveOrder') {
      await mutateState((state) => {
        const order = state.orders.find((row) => row.id === Number(data.id));
        if (order) {
          order.archived = true;
          order.updatedAt = stamp;
        }
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'registerPayment') {
      const applied = await mutateState((state) => {
        const orderId = Number(data.orderId);
        const amount = Math.max(0, Number(data.amount ?? 0));
        const order = state.orders.find((row) => row.id === orderId);
        if (!order || !amount) throw new ApiError('Pago inválido');
        const value = Math.min(amount, order.total - order.paid);
        state.payments.push({
          id: nextId(state.payments),
          orderId,
          amount: value,
          method: asText(data.method, 'Transferencia'),
          note: asText(data.note),
          createdAt: stamp,
        });
        order.paid += value;
        order.updatedAt = stamp;
        const customer = state.customers.find(
          (row) => row.id === order.customerId,
        );
        if (customer) {
          customer.balance = Math.max(0, customer.balance - value);
          customer.updatedAt = stamp;
        }
        return value;
      });
      return Response.json({ ok: true, applied });
    }

    throw new ApiError('Acción desconocida');
  } catch (error) {
    return apiFailure(error);
  }
}
