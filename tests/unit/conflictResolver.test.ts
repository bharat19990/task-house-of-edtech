import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

describe('conflictResolver', () => {
  it('should merge two independent updates without data loss', () => {
    
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const text1 = doc1.getText('content');
    text1.insert(0, 'Hello from User A');

    const text2 = doc2.getText('content');
    text2.insert(0, 'Hello from User B');

    const state1 = Y.encodeStateAsUpdate(doc1);
    const state2 = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc1, state2);

    Y.applyUpdate(doc2, state1);

    const finalText1 = doc1.getText('content').toString();
    const finalText2 = doc2.getText('content').toString();

    expect(finalText1).toBe(finalText2);
    
    expect(finalText1).toContain('Hello from User A');
    expect(finalText1).toContain('Hello from User B');

    doc1.destroy();
    doc2.destroy();
  });

  it('should handle concurrent edits at the same position deterministically', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const baseDoc = new Y.Doc();
    baseDoc.getText('content').insert(0, 'Hello');
    const baseState = Y.encodeStateAsUpdate(baseDoc);

    Y.applyUpdate(doc1, baseState);
    Y.applyUpdate(doc2, baseState);

    doc1.getText('content').insert(5, ' World');

    doc2.getText('content').insert(5, ' Earth');

    const state1 = Y.encodeStateAsUpdate(doc1);
    const state2 = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc1, state2);
    Y.applyUpdate(doc2, state1);

    const final1 = doc1.getText('content').toString();
    const final2 = doc2.getText('content').toString();

    expect(final1).toBe(final2);
    expect(final1).toContain('Hello');
    expect(final1).toContain('World');
    expect(final1).toContain('Earth');

    baseDoc.destroy();
    doc1.destroy();
    doc2.destroy();
  });

  it('should be idempotent — applying same update twice has no effect', () => {
    const doc = new Y.Doc();
    doc.getText('content').insert(0, 'Test content');

    const update = Y.encodeStateAsUpdate(doc);
    const stateBefore = doc.getText('content').toString();

    Y.applyUpdate(doc, update);
    const stateAfter = doc.getText('content').toString();

    expect(stateBefore).toBe(stateAfter);

    doc.destroy();
  });

  it('should merge offline edits when both users reconnect', () => {
    
    const baseDoc = new Y.Doc();
    baseDoc.getText('content').insert(0, 'Shared document');
    const baseState = Y.encodeStateAsUpdate(baseDoc);

    const docA = new Y.Doc();
    Y.applyUpdate(docA, baseState);
    docA.getText('content').insert(15, ' — edited by A');

    const docB = new Y.Doc();
    Y.applyUpdate(docB, baseState);
    docB.getText('content').insert(15, ' — edited by B');

    const serverDoc = new Y.Doc();
    Y.applyUpdate(serverDoc, baseState);

    const updateA = Y.encodeStateAsUpdate(docA);
    const updateB = Y.encodeStateAsUpdate(docB);

    Y.applyUpdate(serverDoc, updateA);
    Y.applyUpdate(serverDoc, updateB);

    const merged = serverDoc.getText('content').toString();

    expect(merged).toContain('Shared document');
    expect(merged).toContain('edited by A');
    expect(merged).toContain('edited by B');

    baseDoc.destroy();
    docA.destroy();
    docB.destroy();
    serverDoc.destroy();
  });
});
