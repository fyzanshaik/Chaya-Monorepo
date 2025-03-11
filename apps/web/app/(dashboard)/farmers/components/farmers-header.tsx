'use client';

import { Button } from '@workspace/ui/components/button';
import { FileDown, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { FarmerFormDialog } from './farmer-form-dialog';
import { useAuth } from '@/app/providers/auth-provider';

export default function FarmersHeader() {
	const { user } = useAuth();
	const isAdmin = user?.role === 'ADMIN';

	const [showAddDialog, setShowAddDialog] = useState(false);

	const handleExport = () => {
		// TODO: Implement export data functionality
		console.log('Export data clicked');
		// This would call a server action to generate and download CSV
	};

	return (
		<div className="flex items-center justify-between">
			<h1 className="text-2xl font-bold tracking-tight">Farmer Dashboard</h1>
			<div className="flex items-center gap-2">
				{isAdmin && (
					<Button variant="outline" size="sm" onClick={handleExport} className="h-9">
						<FileDown className="mr-2 h-4 w-4" />
						Export Data
					</Button>
				)}

				<Button size="sm" onClick={() => setShowAddDialog(true)} className="h-9">
					<PlusCircle className="mr-2 h-4 w-4" />
					Add Farmer
				</Button>

				<FarmerFormDialog mode="add" open={showAddDialog} onOpenChange={setShowAddDialog} />
			</div>
		</div>
	);
}
