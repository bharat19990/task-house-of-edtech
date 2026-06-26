import { z } from 'zod';
import type { CollaboratorRole } from './collaborator';

export interface IDocument {
  _id: string;
  title: string;
  ownerId: string;
  yjsState: Buffer;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentData {
  id: string;
  title: string;
  ownerId: string;
  content: string;
  isDeleted: boolean;
  role: CollaboratorRole;
  collaboratorCount: number;
  createdAt: string;
  updatedAt: string;
}

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  content: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
