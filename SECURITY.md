# Security Policy and Considerations

This document outlines the security architecture, design patterns, and threat mitigations implemented in **CollabEdit**.

---

## 1. Authentication & Authorization Model

### NextAuth v5 (Auth.js)
CollabEdit uses NextAuth v5 for user authentication using the JWT strategy.
- Credentials provider hashes user passwords using `bcryptjs` with 12 salt rounds during registration.
- Sensitive endpoints require a valid session context via NextAuth's `auth()` helper.

### WebSocket Token Authentication
Because WebSocket connections cannot read HTTP-only cookies across subdomains or ports in a standard way:
1. The client requests a short-lived JSON Web Token (JWT) from `/api/auth/token` (which is authenticated via NextAuth session).
2. The server signs a JWT containing the user's `id` and `name` with a 1-hour expiration.
3. The client connects to the WebSocket server using this token as a URL parameter (`ws://localhost:1234/doc-id?token=JWT`).
4. The WebSocket server decodes the token and verifies the signature using `JWT_SECRET`.

---

## 2. Tenant Isolation & Access Control

Since MongoDB is the storage database for this workspace:
- Every document is associated with an `ownerId`.
- Collaborators are defined in the `Collaborator` collection with specific roles (`owner`, `editor`, `viewer`).
- **Role Verification**:
  - For any GET/PATCH/DELETE request on a document or sync endpoint, the backend checks the user's ID against the document owner and the collaborator list.
  - Viewers are blocked from sending changes or calling the sync endpoint.
  - The WebSocket server rejects connections if a user does not have an owner, editor, or viewer relationship with the requested document.
  - If a user's role is `viewer`, the WebSocket server rejects any incoming message from that connection, enforcing a strict read-only model.

---

## 3. Resource Exhaustion & OOM Protection

### Request Payload Size Guards
Attackers can send massive payloads without a `Content-Length` header (e.g. using chunked transfer encoding) to exhaust server memory and trigger an Out of Memory (OOM) crash.
To prevent this:
1. **Content-Length Header Check**: The server checks the `Content-Length` header early. If it exceeds 2MB, the request is immediately rejected.
2. **Streaming Parser Limit**: For requests without a `Content-Length` header, a streaming body parser reads incoming chunks on-the-fly. If the cumulative bytes read exceed 2MB, the stream reader is cancelled immediately and the request is closed with a `413 Payload Too Large` error.
3. **Parsed Body Validation**: A secondary check verifies the size of the parsed JSON object before processing.

### WebSocket Limits
- **Connection Limits**: The WebSocket server limits connections to a maximum of **50 concurrent connections per room** to protect server memory and bandwidth.
- **Message Size Limits**: Incoming WebSocket messages are checked. Any message exceeding **1MB** is dropped immediately.

---

## 4. Rate Limiting Strategy

Sensitive endpoints, such as document sync, are protected by an in-memory token-bucket rate limiter:
- Scoped per user ID.
- Blocks requests exceeding standard thresholds and sends a `429 Too Many Requests` response with a `Retry-After` header.

---

## 5. CRDT Conflict Resolution (Yjs)

Yjs resolves merge conflicts automatically using Conflict-free Replicated Data Types (CRDTs).
- Changes are tracked using unique client IDs and clock vectors.
- Overlapping offline edits are merged deterministically on the client and server using Yjs's logical timestamping, ensuring eventual consistency.
- No editing state is lost or silently overwritten.

---

## 6. Input Validation

All incoming API requests are validated schema-side using **Zod**:
- Registration and login payloads are validated against strict Zod schemas (`registerUserSchema`, `loginUserSchema`).
- Document updates and Yjs sync payloads are structured and typed using schemas (`createDocumentSchema`, `updateDocumentSchema`, `createVersionSchema`).
