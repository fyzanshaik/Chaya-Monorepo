'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { DocumentUploader } from '../upload/document-uploader';

export function DocumentsSection() {
	const { control } = useFormContext();

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6">
				<FormField
					control={control}
					name="documents.profilePicUrl"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Profile Picture</FormLabel>
							<FormControl>
								<DocumentUploader endpoint="profilePicture" label="Profile Picture" value={field.value} onChange={field.onChange} accept="image/*" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="documents.aadharDocUrl"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Aadhar Document</FormLabel>
							<FormControl>
								<DocumentUploader endpoint="aadharDocument" label="Aadhar Document" value={field.value} onChange={field.onChange} accept="image/*,.pdf" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="documents.bankDocUrl"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Bank Document</FormLabel>
							<FormControl>
								<DocumentUploader endpoint="bankDocument" label="Bank Document" value={field.value} onChange={field.onChange} accept="image/*,.pdf" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}
