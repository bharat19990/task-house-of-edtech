import { syncPayloadSchema } from '@/types/sync';
import { createDocumentSchema, updateDocumentSchema } from '@/types/document';
import { createVersionSchema } from '@/types/version';
import { addCollaboratorSchema, updateCollaboratorSchema } from '@/types/collaborator';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export function validateSyncPayload(payload: unknown): ValidationResult<{
  clientId: string;
  yjsUpdate: string;
  timestamp: string;
}> {
  const result = syncPayloadSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { success: true, data: result.data };
}

export function validateCreateDocument(payload: unknown): ValidationResult<{
  title: string;
}> {
  const result = createDocumentSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { success: true, data: result.data };
}

export function validateUpdateDocument(payload: unknown): ValidationResult<{
  title?: string;
  content?: string;
}> {
  const result = updateDocumentSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { success: true, data: result.data };
}

export function validateCreateVersion(payload: unknown): ValidationResult<{
  label: string;
  yjsSnapshot: string;
  contentSnapshot: string;
}> {
  const result = createVersionSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { success: true, data: result.data };
}

export function validateAddCollaborator(payload: unknown): ValidationResult<{
  email: string;
  role: 'editor' | 'viewer';
}> {
  const result = addCollaboratorSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { success: true, data: result.data as { email: string; role: 'editor' | 'viewer' } };
}

export function validateUpdateCollaborator(payload: unknown): ValidationResult<{
  collaboratorId: string;
  role: 'editor' | 'viewer';
}> {
  const result = updateCollaboratorSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { success: true, data: result.data as { collaboratorId: string; role: 'editor' | 'viewer' } };
}
