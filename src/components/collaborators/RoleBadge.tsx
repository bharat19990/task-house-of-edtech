'use client';

import { Badge } from '@/components/ui/badge';
import type { CollaboratorRole } from '@/types/collaborator';
import { cn } from '@/lib/utils/cn';

interface RoleBadgeProps {
  role: CollaboratorRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    owner: { label: 'Owner', className: 'bg-primary/10 text-primary border-primary/20' },
    editor: { label: 'Editor', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    viewer: { label: 'Viewer', className: 'bg-muted text-muted-foreground border-border' },
  };

  const c = config[role];

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', c.className)}>
      {c.label}
    </Badge>
  );
}
