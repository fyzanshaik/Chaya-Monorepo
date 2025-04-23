import { z } from 'zod';

export const createProcurementSchema = z.object({
  farmerId: z.number(),
  crop: z.string().min(1, 'Crop is required'),
  procuredForm: z.string().min(1, 'Procured form is required'),
  speciality: z.string().min(1, 'Speciality is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  date: z.string().transform(str => new Date(str)),
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (expected HH:mm:ss)'),
  lotNo: z.number().int().min(1).max(3, 'Lot number must be 1, 2, or 3'),
  procuredBy: z.string().min(1, 'Procured by is required'),
  vehicleNo: z.string().min(1, 'Vehicle number is required'),
});

export type CreateProcurementInput = z.infer<typeof createProcurementSchema>;
