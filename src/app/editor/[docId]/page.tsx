'use client';

import { useEffect, useMemo, useCallback, use, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { History, Users, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Editor } from '@/components/editor/Editor';
import { EditorErrorBoundary } from '@/components/editor/ErrorBoundary';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ConnectionStatus } from '@/components/editor/ConnectionStatus';
import { SyncStatusIndicator } from '@/components/editor/SyncStatusIndicator';
import { WordCount } from '@/components/editor/WordCount';
import { CollaboratorCursors } from '@/components/editor/CollaboratorCursors';
import dynamic from 'next/dynamic';

const VersionPanel = dynamic(() => import('@/components/versions/VersionPanel').then((mod) => mod.VersionPanel), {
  ssr: false,
});
const CollaboratorPanel = dynamic(() => import('@/components/collaborators/CollaboratorPanel').then((mod) => mod.CollaboratorPanel), {
  ssr: false,
});
const AIAssistantPanel = dynamic(() => import('@/components/ai/AIAssistantPanel').then((mod) => mod.AIAssistantPanel), {
  ssr: false,
});
import { useEditor } from '@/hooks/useEditor';
import { useYjsSync } from '@/hooks/useYjsSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { useDocumentRole } from '@/hooks/useDocumentRole';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useEditorStore } from '@/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { encodeDocState } from '@/lib/yjs/yjsUtils';
import { uint8ArrayToBase64 } from '@/lib/yjs/yjsUtils';
import { toast } from 'sonner';
import { enqueueSyncOp } from '@/lib/sync/syncQueue';
import { runSyncCycle } from '@/lib/sync/syncEngine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import type { VersionData } from '@/types/version';

const CURSOR_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9',
  '#f472b6', '#a78bfa', '#34d399', '#38bdf8', '#fbbf24',
];

export default function EditorPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();

  const { setActiveDocument, title, isReadOnly } = useEditorStore();
  const {
    isVersionPanelOpen, isCollaboratorPanelOpen, isAIPanelOpen,
    toggleVersionPanel, toggleCollaboratorPanel, toggleAIPanel,
    closeAllPanels,
  } = useUIStore();

  const { role, isLoading: isRoleLoading } = useDocumentRole(docId);

  const [wsToken, setWsToken] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/auth/token')
        .then((res) => res.json())
        .then((data) => {
          if (data.token) {
            setWsToken(data.token);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch WebSocket token', err);
        });
    }
  }, [session]);

  const { doc, wsProvider, connectionStatus } = useYjsSync(docId, wsToken);

  useSyncEngine(docId, isOnline);

  const userColor = useMemo(
    () => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)] ?? '#818cf8',
    [],
  );

  const editor = useEditor({
    doc,
    provider: wsProvider,
    userName: session?.user?.name ?? 'Anonymous',
    userColor,
    isReadOnly: role === 'viewer',
  });

  const { versions, isLoading: isVersionsLoading, fetchVersions, createVersion, restoreVersion } =
    useVersionHistory(docId);

  const {
    summarize, summaryResult, isLoadingSummary,
    improve, improveResult, isLoadingImprove,
  } = useAIAssistant();

  useEffect(() => {
    if (role && docId) {

      fetch(`/api/documents/${docId}`)
        .then((r) => r.json())
        .then((data) => {
          setActiveDocument(docId, data.title ?? 'Untitled', role);
        })
        .catch(() => {
          setActiveDocument(docId, 'Untitled', role);
        });
    }
  }, [docId, role, setActiveDocument]);

  useEffect(() => {
    if (isVersionPanelOpen) fetchVersions();
  }, [isVersionPanelOpen, fetchVersions]);

  useEffect(() => {
    if (!doc || !docId) return;

    const handleUpdate = async (update: Uint8Array, origin: unknown) => {

      const originObj = origin as Record<string, unknown> | null;
      const isWsProvider = origin === wsProvider ||
        (originObj && originObj.constructor && (originObj.constructor as { name: string }).name === 'WebsocketProvider');
      if (isWsProvider) {
        return;
      }

      const base64Update = uint8ArrayToBase64(update);
      try {
        await enqueueSyncOp(docId, base64Update);
        if (isOnline) {
          runSyncCycle();
        }
      } catch (error) {
        console.error('Failed to enqueue offline sync update:', error);
      }
    };

    doc.on('update', handleUpdate);
    return () => {
      doc.off('update', handleUpdate);
    };
  }, [doc, docId, wsProvider, isOnline]);

  const [activeUsers, setActiveUsers] = useState<{ name: string; color: string }[]>([]);
  useEffect(() => {
    interface CustomAwareness {
      getStates: () => Map<number, { user?: { name?: string; color?: string } }>;
      on: (event: string, callback: () => void) => void;
      off: (event: string, callback: () => void) => void;
    }

    const provider = wsProvider as unknown as { awareness?: CustomAwareness };
    if (!provider || !provider.awareness) return;

    const awareness = provider.awareness;

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const usersList: { name: string; color: string }[] = [];

      states.forEach((state) => {
        if (state.user) {
          usersList.push({
            name: state.user.name ?? 'Anonymous',
            color: state.user.color ?? '#818cf8',
          });
        }
      });

      setActiveUsers(usersList);
    };

    awareness.on('change', handleAwarenessChange);

    handleAwarenessChange();

    return () => {
      awareness.off('change', handleAwarenessChange);
    };
  }, [wsProvider]);

  const [previewVersion, setPreviewVersion] = useState<VersionData | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (doc) {
          const state = encodeDocState(doc);
          const content = editor?.getText() ?? '';
          createVersion(
            `Auto-save ${new Date().toLocaleString()}`,
            uint8ArrayToBase64(state),
            content,
          );
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggleAIPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, editor, createVersion, toggleAIPanel]);

  const handleSaveVersion = useCallback(
    (label: string) => {
      if (!doc) return;
      const state = encodeDocState(doc);
      const content = editor?.getText() ?? '';
      createVersion(label, uint8ArrayToBase64(state), content);
    },
    [doc, editor, createVersion],
  );

  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      if (!confirm('Restore this version? Current state will be auto-saved first.')) return;
      const serverState = await restoreVersion(versionId);
      if (serverState) {
        toast.success('Document restored');
      }
    },
    [restoreVersion],
  );

  if (sessionStatus === 'loading' || isRoleLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  if (!role) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">You don&apos;t have access to this document.</p>
        <Link href="/dashboard">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem-3.5rem)]">
      { }
      <div className="flex-1 flex flex-col min-w-0">
        { }
        <div className="flex items-center justify-between border-b px-4 py-2 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold truncate">{title || 'Untitled'}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SyncStatusIndicator />
            <ConnectionStatus status={connectionStatus} />
            <CollaboratorCursors users={activeUsers} />
            <div className="h-6 w-px bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleVersionPanel} title="Version History">
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCollaboratorPanel} title="Collaborators">
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleAIPanel} title="AI Assistant (Ctrl+/)">
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>

        { }
        {!isReadOnly && <EditorToolbar editor={editor} />}

        { }
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <EditorErrorBoundary>
              <Editor editor={editor} />
            </EditorErrorBoundary>
          </div>
        </div>

        { }
        <div className="flex items-center justify-between border-t px-4 py-1.5">
          <WordCount editor={editor} />
          <div className="text-xs text-muted-foreground capitalize">{role} mode</div>
        </div>
      </div>

      { }
      {isVersionPanelOpen && (
        <VersionPanel
          docId={docId}
          versions={versions}
          isLoading={isVersionsLoading}
          canRestore={role === 'owner'}
          isOpen={isVersionPanelOpen}
          onClose={closeAllPanels}
          onSaveVersion={handleSaveVersion}
          onPreview={setPreviewVersion}
          onRestore={handleRestoreVersion}
        />
      )}
      {isCollaboratorPanelOpen && (
        <CollaboratorPanel
          docId={docId}
          currentUserRole={role}
          isOpen={isCollaboratorPanelOpen}
          onClose={closeAllPanels}
        />
      )}
      {isAIPanelOpen && (
        <AIAssistantPanel
          editor={editor}
          isOpen={isAIPanelOpen}
          onClose={closeAllPanels}
          summaryResult={summaryResult}
          improveResult={improveResult}
          isLoadingSummary={isLoadingSummary}
          isLoadingImprove={isLoadingImprove}
          onSummarize={summarize}
          onImprove={improve}
        />
      )}
      {previewVersion && (
        <Dialog open={!!previewVersion} onOpenChange={(open) => !open && setPreviewVersion(null)}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Version Preview — {previewVersion.label}</DialogTitle>
              <DialogDescription>
                Created by {previewVersion.createdByName} on {new Date(previewVersion.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto border rounded p-4 bg-muted/30 whitespace-pre-wrap font-sans text-sm">
              {previewVersion.contentSnapshot || '(Empty document)'}
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Close Preview</Button>
              </DialogClose>
              {role === 'owner' && (
                <Button onClick={() => {
                  handleRestoreVersion(previewVersion.id);
                  setPreviewVersion(null);
                }}>
                  Restore This Version
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
