// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/next';

// Use the FileRouter feature
const f = createUploadthing();

// Define the routes based on the documentation
export const ourFileRouter: FileRouter = {
	// Profile picture route - image only, 500KB max
	profilePicture: f({ image: { maxFileSize: '1024KB', maxFileCount: 1 } })
		.middleware(async () => {
			console.log('Middleware running for profilePicture');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Profile picture upload complete', file.url);
			return { url: file.url };
		}),

	// Aadhar document route - PDF or image, 500KB max
	aadharDocument: f({
		image: { maxFileSize: '1024KB', maxFileCount: 1 },
		pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
	})
		.middleware(async () => {
			console.log('Middleware running for aadharDocument');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Aadhar document upload complete', file.url);
			return { url: file.url };
		}),

	// Bank document route - PDF or image, 500KB max
	bankDocument: f({
		image: { maxFileSize: '1024KB', maxFileCount: 1 },
		pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
	})
		.middleware(async () => {
			console.log('Middleware running for bankDocument');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Bank document upload complete', file.url);
			return { url: file.url };
		}),

	// Land document route - PDF or image, 500KB max
	landDocument: f({
		image: { maxFileSize: '1024KB', maxFileCount: 1 },
		pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
	})
		.middleware(async () => {
			console.log('Middleware running for landDocument');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Land document upload complete', file.url);
			return { url: file.url };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
