export type DesignFolder = {
  id: number;
  name: string;
  customerId: number | null;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryDesign = {
  id: number;
  folderId: number | null;
  customerId: number | null;
  name: string;
  originalName: string;
  fileKey: string;
  mimeType: string;
  size: number;
  tags: string[];
  notes: string;
  widthPx: number;
  heightPx: number;
  createdAt: string;
  updatedAt: string;
};

export const designFileUrl = (fileKey: string) =>
  `/api/files?key=${encodeURIComponent(fileKey)}`;

export const isPreviewableImage = (mimeType: string) =>
  ['image/png', 'image/jpeg', 'image/webp'].includes(mimeType);
