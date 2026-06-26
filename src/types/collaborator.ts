import { z } from 'zod';

export const COLLABORATOR_ROLES = ['owner', 'editor', 'viewer'] as const;

export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

export const collaboratorRoleSchema = z.enum(COLLABORATOR_ROLES);

export interface ICollaborator {
  _id: string;
  documentId: string;
  userId: string;
  role: CollaboratorRole;
  addedAt: Date;
}

export interface CollaboratorWithUser {
  _id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: CollaboratorRole;
  addedAt: string;
}

export const addCollaboratorSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: collaboratorRoleSchema.refine((r) => r !== 'owner', {
    message: 'Cannot assign owner role',
  }),
});

export const updateCollaboratorSchema = z.object({
  collaboratorId: z.string().min(1),
  role: collaboratorRoleSchema.refine((r) => r !== 'owner', {
    message: 'Cannot assign owner role',
  }),
});

export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type UpdateCollaboratorInput = z.infer<typeof updateCollaboratorSchema>;
