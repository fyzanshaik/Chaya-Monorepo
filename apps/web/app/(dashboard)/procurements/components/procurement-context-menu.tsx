'use client';

import type React from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@workspace/ui/components/context-menu';
import type { ProcurementWithRelations } from '../lib/types';
import { Edit, Eye, Trash } from 'lucide-react';

interface ProcurementContextMenuProps {
  procurement: ProcurementWithRelations;
  children: React.ReactNode;
  onEdit: () => void;
  onDelete?: () => void;
  isAdmin: boolean;
}

export function ProcurementContextMenu({
  procurement,
  children,
  onEdit,
  onDelete,
  isAdmin,
}: ProcurementContextMenuProps) {
  const handleView = () => {
    // Dispatch a custom event to open the details dialog
    const event = new CustomEvent('viewProcurement', {
      detail: { procurement },
    });
    document.dispatchEvent(event);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </ContextMenuItem>
        {isAdmin && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit Procurement
            </ContextMenuItem>
            {onDelete && (
              <ContextMenuItem onClick={onDelete} className="cursor-pointer text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete Procurement
              </ContextMenuItem>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
