'use client';
/* oxlint-disable next/no-img-element -- Authenticated Netlify Blob previews cannot use the public image optimizer. */

import type React from 'react';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shirt,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { readJsonResponse } from '@/lib/api-response';
import {
  designFileUrl,
  isPreviewableImage,
  type DesignFolder,
  type LibraryDesign,
} from '@/lib/library-types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type CustomerOption = { id: number; name: string };
type Mutation = (
  payload: Record<string, unknown>,
  success: string,
) => Promise<unknown>;

const acceptedTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
];
const folderTones = [
  { value: 'teal', label: 'Verde', className: 'bg-teal-100 text-teal-700' },
  { value: 'cyan', label: 'Celeste', className: 'bg-cyan-100 text-cyan-700' },
  {
    value: 'violet',
    label: 'Violeta',
    className: 'bg-violet-100 text-violet-700',
  },
  {
    value: 'amber',
    label: 'Amarillo',
    className: 'bg-amber-100 text-amber-700',
  },
  { value: 'rose', label: 'Rosa', className: 'bg-rose-100 text-rose-700' },
];

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const imageDimensions = (file: File) =>
  new Promise<{ widthPx: number; heightPx: number }>((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ widthPx: 0, heightPx: 0 });
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ widthPx: 0, heightPx: 0 });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });

export function DesignLibrary({
  folders,
  designs,
  customers,
  mutate,
  onUseInBuilder,
}: {
  folders: DesignFolder[];
  designs: LibraryDesign[];
  customers: CustomerOption[];
  mutate: Mutation;
  onUseInBuilder: (design: LibraryDesign) => void;
}) {
  const [folderFilter, setFolderFilter] = useState<'all' | 'root' | number>(
    'all',
  );
  const [customerFilter, setCustomerFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DesignFolder | null>(null);
  const [editingDesign, setEditingDesign] = useState<LibraryDesign | null>(
    null,
  );
  const [preview, setPreview] = useState<LibraryDesign | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [localError, setLocalError] = useState('');

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const customerName = (id: number | null) =>
    (id ? customerNames.get(id) : null) ?? 'Sin cliente';
  const folderName = (id: number | null) =>
    folders.find((folder) => folder.id === id)?.name ?? 'Sin carpeta';
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return designs.filter((design) => {
      const inFolder =
        folderFilter === 'all' ||
        (folderFilter === 'root'
          ? design.folderId === null
          : design.folderId === folderFilter);
      const inCustomer =
        customerFilter === 'all' ||
        design.customerId === Number(customerFilter);
      const searchable = [
        design.name,
        design.originalName,
        design.notes,
        ...design.tags,
        (design.customerId ? customerNames.get(design.customerId) : null) ??
          'Sin cliente',
      ]
        .join(' ')
        .toLocaleLowerCase();
      return inFolder && inCustomer && (!term || searchable.includes(term));
    });
  }, [customerFilter, customerNames, designs, folderFilter, query]);

  const setSelectedFiles = (incoming: File[]) => {
    setLocalError('');
    const valid = incoming.filter(
      (file) =>
        acceptedTypes.includes(file.type) && file.size <= 20 * 1024 * 1024,
    );
    if (valid.length !== incoming.length)
      setLocalError(
        'Algunos archivos se omitieron. Usá PNG, JPG, WEBP o PDF de hasta 20 MB.',
      );
    setFiles(valid.slice(0, 30));
  };

  const uploadDesigns = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!files.length) {
      setLocalError('Elegí al menos un archivo.');
      return;
    }
    setBusy(true);
    setLocalError('');
    const values = new FormData(event.currentTarget);
    const tags = values.get('tags');
    const notes = values.get('notes');
    const uploadedKeys: string[] = [];
    try {
      const uploaded: Record<string, unknown>[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress(`Subiendo ${index + 1} de ${files.length}: ${file.name}`);
        const body = new FormData();
        body.set('file', file);
        const response = await fetch('/api/files', { method: 'POST', body });
        const stored = await readJsonResponse<{
          error?: string;
          key: string;
          name: string;
          size: number;
          type: string;
        }>(response);
        if (!response.ok)
          throw new Error(stored.error || `No se pudo subir ${file.name}`);
        uploadedKeys.push(stored.key);
        const dimensions = await imageDimensions(file);
        uploaded.push({
          name: file.name.replace(/\.[^.]+$/, ''),
          originalName: stored.name,
          fileKey: stored.key,
          mimeType: stored.type,
          size: stored.size,
          folderId: values.get('folderId'),
          customerId: values.get('customerId'),
          tags: typeof tags === 'string' ? tags : '',
          notes: typeof notes === 'string' ? notes : '',
          ...dimensions,
        });
      }
      setProgress('Guardando en la biblioteca…');
      await mutate(
        { action: 'createDesigns', designs: uploaded },
        `${uploaded.length} diseño${uploaded.length === 1 ? '' : 's'} guardado${uploaded.length === 1 ? '' : 's'}`,
      );
      setFiles([]);
      setUploadOpen(false);
    } catch (error) {
      await Promise.allSettled(
        uploadedKeys.map((key) =>
          fetch(`/api/files?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
          }),
        ),
      );
      setLocalError(
        error instanceof Error
          ? error.message
          : 'No se pudieron subir los diseños',
      );
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const removeDesign = async (design: LibraryDesign) => {
    if (!window.confirm(`¿Eliminar definitivamente “${design.name}”?`)) return;
    try {
      await mutate(
        { action: 'deleteDesign', id: design.id },
        'Diseño eliminado',
      );
      await fetch(`/api/files?key=${encodeURIComponent(design.fileKey)}`, {
        method: 'DELETE',
      });
      if (preview?.id === design.id) setPreview(null);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'No se pudo eliminar',
      );
    }
  };

  const storage = designs.reduce((sum, design) => sum + design.size, 0);
  const linkedCustomers = new Set(
    designs.map((design) => design.customerId).filter(Boolean),
  ).size;

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Archivos de producción
          </p>
          <h1 className="font-heading text-3xl font-black tracking-[-0.045em] sm:text-[38px]">
            Biblioteca de diseños
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ordená los archivos finales por carpeta y cliente, y reutilizalos en
            el armador DTF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-11 rounded-xl px-4 font-bold"
            onClick={() => {
              setEditingFolder(null);
              setFolderOpen(true);
            }}
          >
            <Folder /> Nueva carpeta
          </Button>
          <Button
            size="lg"
            className="h-11 rounded-xl px-5 font-bold"
            onClick={() => {
              setLocalError('');
              setUploadOpen(true);
            }}
          >
            <Upload /> Subir diseños
          </Button>
        </div>
      </div>

      {localError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{localError}</span>
          <button
            className="ml-auto"
            aria-label="Cerrar aviso"
            onClick={() => setLocalError('')}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LibraryMetric
          icon={FileImage}
          label="Diseños"
          value={String(designs.length)}
        />
        <LibraryMetric
          icon={FolderOpen}
          label="Carpetas"
          value={String(folders.length)}
        />
        <LibraryMetric
          icon={HardDrive}
          label="Espacio usado"
          value={formatBytes(storage)}
        />
        <LibraryMetric
          icon={UserRound}
          label="Clientes vinculados"
          value={String(linkedCustomers)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-2xl border bg-card p-3 shadow-soft">
          <p className="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-[.12em] text-muted-foreground">
            Carpetas
          </p>
          <FolderButton
            active={folderFilter === 'all'}
            icon={FolderOpen}
            label="Todos los diseños"
            count={designs.length}
            onClick={() => setFolderFilter('all')}
          />
          <FolderButton
            active={folderFilter === 'root'}
            icon={FileImage}
            label="Sin carpeta"
            count={designs.filter((design) => design.folderId === null).length}
            onClick={() => setFolderFilter('root')}
          />
          <div className="my-2 border-t" />
          {folders.map((folder) => {
            const tone =
              folderTones.find((item) => item.value === folder.color) ??
              folderTones[0];
            const count = designs.filter(
              (design) => design.folderId === folder.id,
            ).length;
            return (
              <div key={folder.id} className="group flex items-center gap-1">
                <button
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${folderFilter === folder.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  onClick={() => setFolderFilter(folder.id)}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg ${folderFilter === folder.id ? 'bg-white/15 text-white' : tone.className}`}
                  >
                    <Folder className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  <span className="text-xs opacity-65">{count}</span>
                </button>
                <button
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-60 hover:bg-muted hover:opacity-100"
                  aria-label={`Editar carpeta ${folder.name}`}
                  onClick={() => {
                    setEditingFolder(folder);
                    setFolderOpen(true);
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            );
          })}
          {!folders.length && (
            <p className="px-3 py-4 text-xs leading-5 text-muted-foreground">
              Creá carpetas por cliente, temporada o tipo de trabajo.
            </p>
          )}
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft sm:flex-row">
            <label htmlFor="library-search" className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar diseños</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="library-search"
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, etiqueta, cliente o nota…"
              />
            </label>
            <NativeSelect
              className="w-full sm:w-[220px]"
              value={customerFilter}
              onChange={(event) => setCustomerFilter(event.target.value)}
            >
              <option value="all">Todos los clientes</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          {filtered.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((design) => (
                <article
                  key={design.id}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <button
                    className="relative block aspect-[4/3] w-full overflow-hidden bg-[linear-gradient(45deg,#f1f5f4_25%,transparent_25%),linear-gradient(-45deg,#f1f5f4_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f4_75%),linear-gradient(-45deg,transparent_75%,#f1f5f4_75%)] bg-[length:20px_20px]"
                    onClick={() => setPreview(design)}
                  >
                    {isPreviewableImage(design.mimeType) ? (
                      <img
                        src={designFileUrl(design.fileKey)}
                        alt={design.name}
                        className="size-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="grid size-full place-items-center">
                        <span className="text-center">
                          <FileText className="mx-auto size-10 text-rose-500" />
                          <strong className="mt-2 block text-sm">
                            Archivo PDF
                          </strong>
                        </span>
                      </span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-zinc-950/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                      {design.mimeType === 'application/pdf'
                        ? 'PDF'
                        : design.mimeType.split('/')[1]}
                    </span>
                  </button>
                  <div className="p-4">
                    <button
                      className="block w-full text-left"
                      onClick={() => setPreview(design)}
                    >
                      <h2
                        className="truncate font-extrabold"
                        title={design.name}
                      >
                        {design.name}
                      </h2>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {customerName(design.customerId)} ·{' '}
                        {folderName(design.folderId)}
                      </p>
                    </button>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {formatBytes(design.size)}
                      </span>
                      <div className="flex gap-1">
                        {isPreviewableImage(design.mimeType) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onUseInBuilder(design)}
                          >
                            <Shirt /> Armador
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Editar ${design.name}`}
                          onClick={() => setEditingDesign(design)}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed bg-card p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ImagePlus className="size-7" />
                </span>
                <h2 className="mt-4 text-lg font-black">
                  No hay diseños en esta vista
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Subí archivos listos o cambiá los filtros para encontrar un
                  diseño guardado.
                </p>
                <Button className="mt-4" onClick={() => setUploadOpen(true)}>
                  <Plus /> Subir el primero
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => !open && !busy && setUploadOpen(false)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              Subir diseños listos
            </DialogTitle>
            <DialogDescription>
              Hasta 30 archivos PNG, JPG, WEBP o PDF de 20 MB cada uno.
            </DialogDescription>
          </DialogHeader>
          <form
            id="library-upload-form"
            className="space-y-4"
            onSubmit={uploadDesigns}
          >
            <div
              className="rounded-2xl"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setSelectedFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[.035] p-5 text-center transition hover:border-primary">
                <Upload className="mb-2 size-7 text-primary" />
                <strong>Arrastrá archivos o hacé clic</strong>
                <span className="mt-1 text-xs text-muted-foreground">
                  Los originales se guardan en tu sitio privado
                </span>
                <input
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  multiple
                  onChange={(event) =>
                    setSelectedFiles(Array.from(event.target.files ?? []))
                  }
                />
              </label>
            </div>
            {files.length > 0 && (
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border bg-muted/35 p-2">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs"
                  >
                    <FileImage className="size-4 text-primary" />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {file.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <LibraryField label="Carpeta">
                <NativeSelect
                  name="folderId"
                  className="w-full"
                  defaultValue={
                    typeof folderFilter === 'number' ? String(folderFilter) : ''
                  }
                >
                  <option value="">Sin carpeta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </NativeSelect>
              </LibraryField>
              <LibraryField label="Cliente">
                <NativeSelect name="customerId" className="w-full">
                  <option value="">Sin cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </NativeSelect>
              </LibraryField>
            </div>
            <LibraryField label="Etiquetas">
              <Input
                name="tags"
                placeholder="Ej.: logo, frente, colección verano"
              />
            </LibraryField>
            <LibraryField label="Notas">
              <Textarea
                name="notes"
                placeholder="Indicaciones de impresión, colores o versión del diseño"
              />
            </LibraryField>
            {(localError || progress) && (
              <div
                className={`flex gap-2 rounded-xl p-3 text-xs ${localError ? 'bg-red-50 text-red-800' : 'bg-primary/10 text-primary'}`}
              >
                {localError ? (
                  <AlertTriangle className="size-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="size-4 shrink-0 animate-pulse" />
                )}
                <span>{localError || progress}</span>
              </div>
            )}
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setUploadOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              form="library-upload-form"
              type="submit"
              disabled={busy || !files.length}
            >
              {busy
                ? 'Subiendo…'
                : `Guardar ${files.length || ''} diseño${files.length === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FolderDialog
        open={folderOpen}
        folder={editingFolder}
        customers={customers}
        mutate={mutate}
        designs={designs}
        close={() => {
          setFolderOpen(false);
          setEditingFolder(null);
        }}
        onDeleted={(id) => {
          if (folderFilter === id) setFolderFilter('all');
        }}
      />
      <DesignEditDialog
        open={Boolean(editingDesign)}
        design={editingDesign}
        folders={folders}
        customers={customers}
        mutate={mutate}
        close={() => setEditingDesign(null)}
        remove={removeDesign}
      />
      <DesignPreview
        open={Boolean(preview)}
        design={preview}
        folderName={preview ? folderName(preview.folderId) : ''}
        customerName={preview ? customerName(preview.customerId) : ''}
        close={() => setPreview(null)}
        edit={() => {
          setEditingDesign(preview);
          setPreview(null);
        }}
        onUseInBuilder={(design) => {
          onUseInBuilder(design);
          setPreview(null);
        }}
        remove={removeDesign}
      />
    </>
  );
}

function LibraryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileImage;
  label: string;
  value: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft">
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </article>
  );
}

function FolderButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: typeof Folder;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
    >
      <Icon className="size-4" />
      <span className="flex-1">{label}</span>
      <span className="text-xs opacity-65">{count}</span>
    </button>
  );
}

function LibraryField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-foreground/75">{label}</span>
      {children}
    </label>
  );
}

function FolderDialog({
  open,
  folder,
  customers,
  mutate,
  designs,
  close,
  onDeleted,
}: {
  open: boolean;
  folder: DesignFolder | null;
  customers: CustomerOption[];
  mutate: Mutation;
  designs: LibraryDesign[];
  close: () => void;
  onDeleted: (id: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const count = folder
    ? designs.filter((design) => design.folderId === folder.id).length
    : 0;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {folder ? 'Editar carpeta' : 'Nueva carpeta'}
          </DialogTitle>
          <DialogDescription>
            Usala para ordenar diseños por cliente, colección o tipo de prenda.
          </DialogDescription>
        </DialogHeader>
        <form
          id="folder-form"
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            try {
              await mutate(
                {
                  action: folder ? 'updateDesignFolder' : 'createDesignFolder',
                  id: folder?.id,
                  ...values,
                },
                folder ? 'Carpeta actualizada' : 'Carpeta creada',
              );
              close();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'No se pudo guardar la carpeta',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <LibraryField label="Nombre">
            <Input
              name="name"
              defaultValue={folder?.name ?? ''}
              placeholder="Ej.: Logos de clientes"
              required
              maxLength={80}
            />
          </LibraryField>
          <LibraryField label="Cliente predeterminado">
            <NativeSelect
              name="customerId"
              className="w-full"
              defaultValue={folder?.customerId ?? ''}
            >
              <option value="">Sin cliente específico</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </NativeSelect>
          </LibraryField>
          <LibraryField label="Color">
            <NativeSelect
              name="color"
              className="w-full"
              defaultValue={folder?.color ?? 'teal'}
            >
              {folderTones.map((tone) => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </NativeSelect>
          </LibraryField>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
              {error}
            </p>
          )}
        </form>
        <DialogFooter className="sm:justify-between">
          {folder && (
            <Button
              variant="destructive"
              disabled={busy || count > 0}
              title={
                count > 0
                  ? 'Mové o eliminá los diseños antes de borrar la carpeta'
                  : 'Eliminar carpeta'
              }
              onClick={async () => {
                if (!window.confirm(`¿Eliminar la carpeta “${folder.name}”?`))
                  return;
                setBusy(true);
                setError('');
                try {
                  await mutate(
                    { action: 'deleteDesignFolder', id: folder.id },
                    'Carpeta eliminada',
                  );
                  onDeleted(folder.id);
                  close();
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : 'No se pudo eliminar la carpeta',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 /> Eliminar
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button form="folder-form" type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DesignEditDialog({
  open,
  design,
  folders,
  customers,
  mutate,
  close,
  remove,
}: {
  open: boolean;
  design: LibraryDesign | null;
  folders: DesignFolder[];
  customers: CustomerOption[];
  mutate: Mutation;
  close: () => void;
  remove: (design: LibraryDesign) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!design) return null;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            Editar diseño
          </DialogTitle>
          <DialogDescription>
            Cambiá su nombre, ubicación y datos de búsqueda. El archivo original
            no se modifica.
          </DialogDescription>
        </DialogHeader>
        <form
          id="design-edit-form"
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            try {
              await mutate(
                {
                  action: 'updateDesign',
                  id: design.id,
                  ...Object.fromEntries(new FormData(event.currentTarget)),
                },
                'Diseño actualizado',
              );
              close();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'No se pudo actualizar el diseño',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <LibraryField label="Nombre">
            <Input
              name="name"
              defaultValue={design.name}
              required
              maxLength={120}
            />
          </LibraryField>
          <div className="grid gap-4 sm:grid-cols-2">
            <LibraryField label="Carpeta">
              <NativeSelect
                name="folderId"
                className="w-full"
                defaultValue={design.folderId ?? ''}
              >
                <option value="">Sin carpeta</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </NativeSelect>
            </LibraryField>
            <LibraryField label="Cliente">
              <NativeSelect
                name="customerId"
                className="w-full"
                defaultValue={design.customerId ?? ''}
              >
                <option value="">Sin cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </NativeSelect>
            </LibraryField>
          </div>
          <LibraryField label="Etiquetas">
            <Input name="tags" defaultValue={design.tags.join(', ')} />
          </LibraryField>
          <LibraryField label="Notas">
            <Textarea name="notes" defaultValue={design.notes} />
          </LibraryField>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
              {error}
            </p>
          )}
        </form>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await remove(design);
                close();
              } finally {
                setBusy(false);
              }
            }}
          >
            <Trash2 /> Eliminar
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button form="design-edit-form" type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DesignPreview({
  open,
  design,
  folderName,
  customerName,
  close,
  edit,
  onUseInBuilder,
  remove,
}: {
  open: boolean;
  design: LibraryDesign | null;
  folderName: string;
  customerName: string;
  close: () => void;
  edit: () => void;
  onUseInBuilder: (design: LibraryDesign) => void;
  remove: (design: LibraryDesign) => Promise<void>;
}) {
  if (!design) return null;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle className="pr-10 text-xl font-extrabold">
            {design.name}
          </DialogTitle>
          <DialogDescription>
            {customerName} · {folderName} · {formatBytes(design.size)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-[360px] place-items-center overflow-hidden rounded-2xl border bg-[linear-gradient(45deg,#f1f5f4_25%,transparent_25%),linear-gradient(-45deg,#f1f5f4_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f4_75%),linear-gradient(-45deg,transparent_75%,#f1f5f4_75%)] bg-[length:20px_20px]">
          {isPreviewableImage(design.mimeType) ? (
            <img
              src={designFileUrl(design.fileKey)}
              alt={design.name}
              className="max-h-[58vh] max-w-full object-contain p-5"
            />
          ) : (
            <iframe
              title={design.name}
              src={designFileUrl(design.fileKey)}
              className="h-[58vh] w-full bg-white"
            />
          )}
        </div>
        {(design.tags.length > 0 || design.notes) && (
          <div className="rounded-xl bg-muted/55 p-4 text-sm">
            {design.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {design.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-card px-2.5 py-1 text-[11px] font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}{' '}
            {design.notes && (
              <p className="leading-6 text-muted-foreground">{design.notes}</p>
            )}
          </div>
        )}
        <DialogFooter className="flex-wrap">
          <Button variant="destructive" onClick={() => void remove(design)}>
            <Trash2 /> Eliminar
          </Button>
          <Button variant="outline" onClick={edit}>
            <Pencil /> Editar
          </Button>
          <a
            href={designFileUrl(design.fileKey)}
            download={design.originalName}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            <Download className="size-4" /> Descargar
          </a>
          {isPreviewableImage(design.mimeType) && (
            <Button onClick={() => onUseInBuilder(design)}>
              <Shirt /> Usar en armador
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
