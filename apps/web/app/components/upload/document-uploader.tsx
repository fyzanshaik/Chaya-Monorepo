'use client';

import { useState } from 'react';
import { UploadDropzone } from '@/utils/uploadthing';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

type UploadEndpoint = 'profilePicture' | 'aadharDocument' | 'bankDocument' | 'landDocument';

interface DocumentUploaderProps {
	endpoint: UploadEndpoint;
	value?: string;
	onChange: (url: string) => void;
	label: string;
	accept?: string;
}

export function DocumentUploader({ endpoint, value, onChange, label }: DocumentUploaderProps) {
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleRemove = () => {
		onChange('');
	};

	return (
		<div className="space-y-2">
			<div className="text-sm font-medium">{label}</div>

			{value ? (
				<Card className="overflow-hidden">
					<CardContent className="p-0">
						<div className="flex items-center justify-between p-4">
							<div className="flex items-center gap-2">
								<Check className="h-5 w-5 text-green-500" />
								<span className="text-sm">Document uploaded</span>
							</div>
							<div className="flex gap-2">
								<Button variant="ghost" size="sm" onClick={handleRemove}>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			) : isUploading ? (
				<Card className="overflow-hidden">
					<CardContent className="p-4">
						<div className="flex flex-col items-center justify-center py-6">
							<Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
							<p className="text-sm text-muted-foreground">Uploading document...</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card className="overflow-hidden">
					<CardContent className="p-4">
						<UploadDropzone
							endpoint={endpoint}
							onUploadBegin={() => {
								setIsUploading(true);
								setError(null);
							}}
							onClientUploadComplete={(res) => {
								setIsUploading(false);
								if (res && res[0]) {
									onChange(res[0].url);
								}
							}}
							onUploadError={(err) => {
								setIsUploading(false);
								setError(err.message);
								console.error('Upload error:', err);
							}}
							content={{
								label: `Upload ${label}`,
								allowedContent: 'Image or PDF up to 500KB',
							}}
							config={{
								mode: 'auto',
							}}
						/>

						{error && <p className="text-sm text-red-500 mt-2">{error}</p>}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
