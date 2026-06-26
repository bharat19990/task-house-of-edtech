'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CursorUser {
  name: string;
  color: string;
}

interface CollaboratorCursorsProps {
  users: CursorUser[];
}

export function CollaboratorCursors({ users }: CollaboratorCursorsProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user, i) => (
          <Avatar
            key={`${user.name}-${i}`}
            className="h-7 w-7 border-2 border-background ring-1"
            style={{ borderColor: user.color }}
          >
            <AvatarFallback
              className="text-[10px] font-bold text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {users.length > 5 && (
        <span className="text-xs text-muted-foreground ml-1">+{users.length - 5}</span>
      )}
    </div>
  );
}
