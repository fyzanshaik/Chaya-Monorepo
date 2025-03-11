'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useState } from 'react';
import { FarmerWithRelations } from '../lib/types';

interface FarmerFormDialogProps {
	mode: 'add' | 'edit';
	farmer?: FarmerWithRelations;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function FarmerFormDialog({ mode, farmer, open, onOpenChange }: FarmerFormDialogProps) {
	const [activeTab, setActiveTab] = useState('personal');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const title = mode === 'add' ? 'Add New Farmer' : 'Edit Farmer';

	const handleSubmit = async () => {
		setIsSubmitting(true);

		try {
			console.log(`${mode === 'add' ? 'Adding' : 'Updating'} farmer`);
			onOpenChange(false);
		} catch (error) {
			console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} farmer:`, error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePrevious = () => {
		const tabs = ['personal', 'address', 'bank', 'documents'];
		const currentIndex = tabs.indexOf(activeTab);
		if (currentIndex > 0) {
			// setActiveTab(tabs[currentIndex - 1]);
		}
	};

	const handleNext = () => {
		const tabs = ['personal', 'address', 'bank', 'documents'];
		const currentIndex = tabs.indexOf(activeTab);
		if (currentIndex < tabs.length - 1) {
			// setActiveTab(tabs[currentIndex + 1]);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="personal">Personal Info</TabsTrigger>
						<TabsTrigger value="address">Address</TabsTrigger>
						<TabsTrigger value="bank">Bank Details</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
					</TabsList>

					<TabsContent value="personal" className="space-y-4">
						<p className="text-sm text-muted-foreground">This is a placeholder for the personal information form fields. The actual form will be implemented with proper validation.</p>
					</TabsContent>

					<TabsContent value="address" className="space-y-4">
						<p className="text-sm text-muted-foreground">This is a placeholder for the address form fields. The actual form will be implemented with proper validation.</p>
					</TabsContent>

					<TabsContent value="bank" className="space-y-4">
						<p className="text-sm text-muted-foreground">This is a placeholder for the bank details form fields. The actual form will be implemented with proper validation.</p>
					</TabsContent>

					<TabsContent value="documents" className="space-y-4">
						<p className="text-sm text-muted-foreground">This is a placeholder for document uploads. The actual form will implement file uploads to S3 or similar storage.</p>
					</TabsContent>
				</Tabs>

				<DialogFooter className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="outline" disabled={activeTab === 'personal'} onClick={handlePrevious}>
							Previous
						</Button>

						<Button variant="outline" disabled={activeTab === 'documents'} onClick={handleNext}>
							Next
						</Button>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : 'Save Farmer'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
