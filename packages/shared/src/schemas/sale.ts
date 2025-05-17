import { z } from 'zod';

export const createSaleSchema = z.object({
  processingBatchId: z.number().int(),
  processingStageId: z.number().int(),
  quantitySold: z.coerce
    .number({
      required_error: 'Quantity sold is required',
      invalid_type_error: 'Quantity sold must be a number',
    })
    .positive('Quantity sold must be positive'),
  dateOfSale: z
    .string()
    .datetime({ message: 'Invalid datetime string. Must be UTC.' })
    .transform(str => new Date(str)),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
