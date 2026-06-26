import * as Y from 'yjs';

export function encodeDocState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc);
}

export function encodeStateVector(doc: Y.Doc): Uint8Array {
  return Y.encodeStateVector(doc);
}

export function computeStateDiff(doc: Y.Doc, remoteStateVector: Uint8Array): Uint8Array {
  return Y.encodeStateAsUpdate(doc, remoteStateVector);
}

export function applyUpdate(doc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(doc, update);
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(uint8Array).toString('base64');
  }
  
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]!);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function createDocFromBase64(base64State: string): Y.Doc {
  const doc = new Y.Doc();
  const update = base64ToUint8Array(base64State);
  Y.applyUpdate(doc, update);
  return doc;
}

export function getPlainTextFromDoc(doc: Y.Doc): string {
  const fragment = doc.getXmlFragment('default');
  return xmlFragmentToText(fragment);
}

function xmlFragmentToText(fragment: Y.XmlFragment): string {
  let text = '';
  fragment.forEach((child) => {
    if (child instanceof Y.XmlText) {
      text += child.toString();
    } else if (child instanceof Y.XmlElement) {
      text += xmlFragmentToText(child);
      
      const tag = child.nodeName;
      if (['paragraph', 'heading', 'p', 'h1', 'h2', 'h3', 'li', 'blockquote'].includes(tag)) {
        text += '\n';
      }
    }
  });
  return text.trim();
}
