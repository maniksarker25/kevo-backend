import { z } from 'zod';

// ✅ Create Bid Zod Schema
export const createBidZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),
        price: z
            .number({ required_error: 'Price is required' })
            .positive('Price must be positive'),
        details: z
            .string({ required_error: 'Details are required' })
            .min(1, 'Details cannot be empty'),
    }),
});

// ✅ Update Bid Zod Schema
export const updateBidZodSchema = z.object({
    body: z.object({
        task: z.string().optional(),
        price: z.number().positive().optional(),
        details: z.string().min(1, 'Details cannot be empty').optional(),
    }),
});

const BidValidations = { createBidZodSchema, updateBidZodSchema };
export default BidValidations;
