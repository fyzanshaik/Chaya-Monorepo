'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { PersonalInfoSection } from './personal-info-section';
import { AddressSection } from './address-section';
import { BankDetailsSection } from './bank-details-section';
import { DocumentsSection } from './documents-section';
import { FieldsSection } from './fields-section';
import { ReviewSection } from './review-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import axios from 'axios';
import { useFarmerFormStore } from '@/app/stores/farmer-form';
import { FieldValues } from 'react-hook-form';
import { useAuth } from '@/app/providers/auth-provider';
import { toast } from 'sonner';
interface FarmerFormProps {
	mode: 'add' | 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	farmerId?: number;
}

export function FarmerForm({ mode, open, onOpenChange, farmerId }: FarmerFormProps) {
	const { user } = useAuth();
	const { activeTab, setActiveTab, goToNextTab, goToPreviousTab, form, isSubmitting, setIsSubmitting } = useFarmerFormStore();
	// console.log('Farmer form mode:', mode);
	const title = mode === 'add' ? 'Add New Farmer' : 'Edit Farmer';
	// useEffect(() => {
	// 	console.log('Form component mounted, form instance:', !!form);
	// 	console.log('Form state:', form?.formState);

	// 	// Check for validation errors when submit is attempted
	// 	return () => {
	// 		console.log('Form component unmounting');
	// 	};
	// }, [form]);

	const handleSubmit = async (data: FieldValues) => {
		setIsSubmitting(true);
		console.log('Submitting data:', JSON.stringify(data, null, 2));

		try {
			const axiosConfig = {
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			};

			if (mode === 'add') {
				console.log('Doing a POST request to add a new farmer');
				const response = await axios.post('http://localhost:5000/api/farmers', data, axiosConfig);
				console.log('POST response:', response.data);
				toast.success('Farmer added successfully');
			} else {
				console.log('Doing a PUT request to update farmer', farmerId);
				const response = await axios.put(`http://localhost:5000/api/farmers/${farmerId}`, data, axiosConfig);
				console.log('PUT response:', response.data);
				toast.success('Farmer updated successfully');
			}

			const dataChangedEvent = new CustomEvent('farmerDataChanged');
			document.dispatchEvent(dataChangedEvent);
			console.log('Data changed event dispatched after successful form submission');

			onOpenChange(false);
		} catch (error: any) {
			console.error('Error submitting form:', error);
			console.error('Error response:', error.response?.data);

			if (error.response?.status === 401) {
				toast.error('Your session has expired. Please log in again.');
			} else {
				toast.error(`Error: ${error.response?.data?.error || error.message || 'Something went wrong'}`);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
					<TabsList className="grid w-full grid-cols-6">
						<TabsTrigger value="personal">Personal</TabsTrigger>
						<TabsTrigger value="address">Address</TabsTrigger>
						<TabsTrigger value="bank">Bank</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
						<TabsTrigger value="fields">Fields</TabsTrigger>
						<TabsTrigger value="review">Review</TabsTrigger>
					</TabsList>
					<TabsContent value="personal" className="space-y-4">
						<PersonalInfoSection />
					</TabsContent>
					<TabsContent value="address" className="space-y-4">
						<AddressSection />
					</TabsContent>
					<TabsContent value="bank" className="space-y-4">
						<BankDetailsSection />
					</TabsContent>
					<TabsContent value="documents" className="space-y-4">
						<DocumentsSection />
					</TabsContent>
					<TabsContent value="fields" className="space-y-4">
						<FieldsSection />
					</TabsContent>
					<TabsContent value="review" className="space-y-4">
						<ReviewSection />
					</TabsContent>
				</Tabs>
				<DialogFooter className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="outline" onClick={goToPreviousTab} disabled={activeTab === 'personal'}>
							Previous
						</Button>
						<Button variant="outline" onClick={goToNextTab} disabled={activeTab === 'review'}>
							Next
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						{activeTab === 'review' && (
							<Button
								type="button"
								onClick={async () => {
									console.log('Submit button clicked, form exists:', !!form);
									if (form) {
										const values = form.getValues();
										// console.log('Current form values:', values);

										const isValid = await form.trigger();
										// console.log('Form validation result:', isValid);

										setTimeout(() => {
											const errors = form.formState.errors;
											// console.log('Detailed errors:', JSON.stringify(errors, null, 2));

											if (errors.farmer) console.log('Farmer field errors:', errors.farmer);
											if (errors.bankDetails) console.log('Bank details errors:', errors.bankDetails);
											if (errors.fields) console.log('Fields errors:', errors.fields);
										}, 100);

										if (isValid) {
											handleSubmit(values);
										}
									}
								}}
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Saving...' : 'Save Farmer'}
							</Button>
						)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
