'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from './RoleBadge';
import type { CollaboratorWithUser, CollaboratorRole } from '@/types/collaborator';
import { toast } from 'sonner';

interface CollaboratorPanelProps {
  docId: string;
  currentUserRole: CollaboratorRole | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CollaboratorPanel({ docId, currentUserRole, isOpen, onClose }: CollaboratorPanelProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithUser[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${docId}/collaborators`);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setCollaborators(data);
    } catch {
      toast.error('Failed to load collaborators');
    } finally {
      setIsLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (isOpen) fetchCollaborators();
  }, [isOpen, fetchCollaborators]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setIsAdding(true);
    try {
      const response = await fetch(`/api/documents/${docId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed');
      }

      toast.success('Collaborator added');
      setEmail('');
      fetchCollaborators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add collaborator');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId }),
      });

      if (!response.ok) throw new Error('Failed');
      toast.success('Collaborator removed');
      fetchCollaborators();
    } catch {
      toast.error('Failed to remove collaborator');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Collaborators</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {currentUserRole === 'owner' && (
        <div className="p-4 border-b space-y-3">
          <Label className="text-xs">Add collaborator</Label>
          <Input
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            disabled={isAdding}
          />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button size="sm" onClick={handleAdd} disabled={isAdding || !email.trim()}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            collaborators.map((collab) => (
              <div key={collab._id} className="flex items-center justify-between gap-2 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {collab.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{collab.userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{collab.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <RoleBadge role={collab.role} />
                  {currentUserRole === 'owner' && collab.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(collab._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
