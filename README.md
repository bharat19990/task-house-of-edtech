# CollabEdit

CollabEdit is a state-of-the-art **Local-First, Real-Time Collaborative Document Editor**. It combines the offline resilience of local database caching (using IndexedDB via Dexie) with the instant-sync capabilities of CRDTs (using Yjs and WebSockets).

---

## Key Features

1. **Local-First Resilience**: All edits are instantly persisted to a local IndexedDB cache. You can write, edit, and manage your documents completely offline.
2. **Conflict-Free Synchronization**: When online, edits are synchronized in real-time using **Yjs CRDTs** over WebSockets, ensuring seamless merge and automatic conflict resolution.
3. **Cursor Awareness**: Real-time cursor positions and names are shared with all connected users on the document.
4. **AI Writing Assistant**: Get instant document summaries and rewrite suggestions powered by AI language models.
5. **Version History**: Save named snapshots of your documents, preview past versions in a read-only dialog, and restore them with a single click.
6. **Robust Security**: Protected by JWT WebSocket authentication, rate limiting, and an advanced streaming body parser that prevents OOM (Out of Memory) resource exhaustion.

---

## Architecture

The following diagram illustrates how data flows between the editor, the local database (Dexie outbox), and the collaborative WebSocket server.

```mermaid
graph TD
    subgraph Client (Browser)
        Editor[TipTap Editor]
        YDoc[Yjs Doc]
        Dexie[Dexie IndexedDB Cache]
        Outbox[Dexie Outbox / Sync Queue]
        SyncEngine[Background Sync Engine]
    end

    subgraph Server (Backend)
        NextApp[Next.js API Routes]
        WS[WebSocket Server]
        DB[(MongoDB Database)]
    end

    Editor <-->|Binds| YDoc
    YDoc -->|Local Save| Dexie
    YDoc -->|On Update| Outbox
    SyncEngine -->|Drains outbox FIFO| NextApp
    NextApp <-->|Sync API| DB
    YDoc <-->|WebSocket Provider| WS
    WS <-->|Reads/Writes Role| DB
```

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Strict TypeScript)
- **State & Collaboration**: Yjs (CRDT), `y-indexeddb`, `y-websocket`
- **Text Editor**: TipTap (ProseMirror wrapper)
- **Local Storage**: Dexie.js (IndexedDB wrapper)
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **Database**: MongoDB via Mongoose
- **Styling**: Tailwind CSS & Radix UI (Shadcn components)
- **Testing**: Playwright (E2E), Vitest (Unit)

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance running locally or in the cloud (URI format: `mongodb://...`)

### Configuration

Create a `.env.local` file in the root directory. You can copy the contents of `.env.local.example` and customize them:

```env
MONGODB_URI=mongodb://localhost:27017/collab-editor
NEXTAUTH_SECRET=your-random-nextauth-secret-key-32-chars
AUTH_SECRET=your-random-nextauth-secret-key-32-chars
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=your-groq-api-key-here
WS_SERVER_URL=ws://localhost:1234
NEXT_PUBLIC_WS_SERVER_URL=ws://localhost:1234
JWT_SECRET=your-jwt-secret-for-websocket-auth
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (runs both Next.js app on port `3000` and WebSocket collab server on port `1234` concurrently):
   ```bash
   npm run dev
   ```

---

## Testing

### Unit Tests
Run standard unit tests using Vitest:
```bash
npm run test
```

### E2E Tests
Run end-to-end integration tests using Playwright:
```bash
npm run test:e2e
```

---

## Security Features

- **OOM Protection**: A streaming request body reader handles all incoming sync payloads, enforcing a strict 2MB limit on the-fly and immediately rejecting oversized streams without overloading memory.
- **WebSocket Auth**: Secure tokens generated on the Next.js backend are verified during upgrade requests to check room/document collaboration access.
- **Rate Limiting**: Integrated token-bucket rate limiter protects sensitive endpoints.
- **Role Scoping**: Document updates are dropped for users with `viewer` permissions.

---

## License

This project is licensed under the MIT License.
