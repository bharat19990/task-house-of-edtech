import { nanoid } from 'nanoid';

export function generateId(size?: number): string {
  return nanoid(size);
}

export function getClientId(): string {
  if (typeof window === 'undefined') return generateId();

  const STORAGE_KEY = 'collab-editor-client-id';
  let clientId = localStorage.getItem(STORAGE_KEY);

  if (!clientId) {
    clientId = generateId();
    localStorage.setItem(STORAGE_KEY, clientId);
  }

  return clientId;
}
