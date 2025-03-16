'use client';

import { FarmerFormProvider } from '@/app/providers/farmer-form-provider';
import { FarmerWithRelations } from '../lib/types';
import { FarmerForm } from '@/app/components/farmer-form/farmer-form';

interface FarmerFormDialogProps {
	mode: 'add' | 'edit';
	farmer?: FarmerWithRelations;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function FarmerFormDialog({ mode, farmer, open, onOpenChange }: FarmerFormDialogProps) {
	return (
		<FarmerFormProvider initialData={farmer} mode={mode}>
			<FarmerForm mode={mode} open={open} onOpenChange={onOpenChange} farmerId={farmer?.id} />
		</FarmerFormProvider>
	);
}
