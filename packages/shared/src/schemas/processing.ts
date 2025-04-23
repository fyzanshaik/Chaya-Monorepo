import { z } from 'zod';

export const createProcessingSchema = z.object({
  procurementId: z.number(),
  lotNo: z.number().int().min(1).max(3, 'Lot number must be 1, 2, or 3'),
  batchNo: z.string().min(1, 'Batch number is required'),
  crop: z.string().min(1, 'Crop is required'),
  procuredForm: z.string().min(1, 'Procured form is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  speciality: z.string().min(1, 'Speciality is required'),
  processMethod: z.enum(['wet', 'dry']),
  dateOfProcessing: z.string().transform(str => new Date(str)),
  dateOfCompletion: z
    .string()
    .transform(str => new Date(str))
    .optional(),
  quantityAfterProcess: z.number().positive('Quantity after process must be a positive number').optional(),
  doneBy: z.string().min(1, 'Done by is required'),
});

export const updateProcessingSchema = createProcessingSchema.partial();

export const createDryingSchema = z.object({
  processingId: z.number(),
  day: z.number().int().positive('Day must be a positive integer'),
  temperature: z.number().positive('Temperature must be a positive number'),
  humidity: z.number().positive('Humidity must be a positive number'),
  pH: z.number().positive('pH must be a positive number'),
  moistureQuantity: z.number().positive('Moisture quantity must be a positive number'),
});

export type CreateProcessingInput = z.infer<typeof createProcessingSchema>;
export type UpdateProcessingInput = z.infer<typeof updateProcessingSchema>;
export type CreateDryingInput = z.infer<typeof createDryingSchema>;
