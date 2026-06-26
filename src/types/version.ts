import { z } from 'zod';

export interface IDocumentVersion {
  _id: string;
  documentId: string;
  createdBy: string;
  label: string;
  yjsSnapshot: Buffer;
  contentSnapshot: string;
  createdAt: Date;
}

export interface VersionData {
  id: string;
  documentId: string;
  createdBy: string;
  createdByName: string;
  label: string;
  contentSnapshot: string;
  createdAt: string;
}

export const createVersionSchema = z.object({
  label: z
    .string()
    .min(1, 'Version label is required')
    .max(100, 'Label must be at most 100 characters'),
  yjsSnapshot: z.string().min(1, 'Yjs snapshot is required'),
  contentSnapshot: z.string(),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
