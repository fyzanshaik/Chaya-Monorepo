'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@workspace/ui/components/dialog';

interface AddFarmerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFarmerDialog({ open, onOpenChange }: AddFarmerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Farmer</DialogTitle>
          <DialogDescription>
            Add a new farmer to the system. Fill in all the required information.
          </DialogDescription>
        </DialogHeader>
        
        {/* Placeholder for the add farmer form */}
        <div className="py-6">
          <p className="text-sm text-muted-foreground">
            This is a placeholder for the Add Farmer form. The actual form will be implemented later.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}