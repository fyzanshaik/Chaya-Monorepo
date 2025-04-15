import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing({
	errorFormatter: (err) => {
		console.log("Error uploading file", err.message)
		console.log("- Above error caused this: ", err.cause)
		return {
			message : err.message
		}
	},
});

export const ourFileRouter: FileRouter = {
	
	profilePicture: f({ image: { maxFileSize: '1024KB', maxFileCount: 1 } })
		.middleware(async () => {
			console.log('Middleware running for profilePicture');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Profile picture upload complete', file.url);
			return { url: file.ufsUrl };
		}),

	aadharDocument: f({
		image: { maxFileSize: '1024KB', maxFileCount: 1 },
		pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
	})
		.middleware(async () => {
			console.log('Middleware running for aadharDocument');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Aadhar document upload complete', file.ufsUrl);
			return { url: file.ufsUrl };
		}),

	bankDocument: f({
		image: { maxFileSize: '1024KB', maxFileCount: 1 },
		pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
	})
		.middleware(async () => {
			console.log('Middleware running for bankDocument');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Bank document upload complete', file.ufsUrl);
			return { url: file.ufsUrl };
		}),

	landDocument: f({
		image: { maxFileSize: '1024KB', maxFileCount: 1 },
		pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
	})
		.middleware(async () => {
			console.log('Middleware running for landDocument');
			return { timestamp: Date.now() };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Land document upload complete', file.ufsUrl);
			return { url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;