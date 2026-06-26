import { describe, it, expect } from 'vitest';
import { syncPayloadSchema } from '../../src/types/sync';
import { createDocumentSchema } from '../../src/types/document';
import { createVersionSchema } from '../../src/types/version';
import { addCollaboratorSchema } from '../../src/types/collaborator';

describe('payloadValidator', () => {
  describe('syncPayloadSchema', () => {
    it('should accept valid sync payload', () => {
      const result = syncPayloadSchema.safeParse({
        clientId: 'test-client-123',
        yjsUpdate: 'dGVzdCBiYXNlNjQ=',
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing clientId', () => {
      const result = syncPayloadSchema.safeParse({
        yjsUpdate: 'dGVzdA==',
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty yjsUpdate', () => {
      const result = syncPayloadSchema.safeParse({
        clientId: 'test',
        yjsUpdate: '',
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid timestamp format', () => {
      const result = syncPayloadSchema.safeParse({
        clientId: 'test',
        yjsUpdate: 'dGVzdA==',
        timestamp: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createDocumentSchema', () => {
    it('should accept valid document title', () => {
      const result = createDocumentSchema.safeParse({ title: 'My Document' });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createDocumentSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 characters', () => {
      const result = createDocumentSchema.safeParse({ title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe('createVersionSchema', () => {
    it('should accept valid version payload', () => {
      const result = createVersionSchema.safeParse({
        label: 'Version 1.0',
        yjsSnapshot: 'base64data',
        contentSnapshot: 'Some text content',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing label', () => {
      const result = createVersionSchema.safeParse({
        yjsSnapshot: 'base64data',
        contentSnapshot: 'text',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('addCollaboratorSchema', () => {
    it('should accept valid collaborator with editor role', () => {
      const result = addCollaboratorSchema.safeParse({
        email: 'user@example.com',
        role: 'editor',
      });
      expect(result.success).toBe(true);
    });

    it('should accept viewer role', () => {
      const result = addCollaboratorSchema.safeParse({
        email: 'user@example.com',
        role: 'viewer',
      });
      expect(result.success).toBe(true);
    });

    it('should reject owner role assignment', () => {
      const result = addCollaboratorSchema.safeParse({
        email: 'user@example.com',
        role: 'owner',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = addCollaboratorSchema.safeParse({
        email: 'not-an-email',
        role: 'editor',
      });
      expect(result.success).toBe(false);
    });
  });
});
