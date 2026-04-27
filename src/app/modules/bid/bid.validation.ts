import { z } from 'zod';

export const createBidZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),
        providerProposedAmount: z
            .number({ required_error: 'providerProposedAmount is required' })
            .positive('providerProposedAmount must be positive'),
    }),
});

export const updateBidZodSchema = z.object({
    body: z.object({
        task: z.string().optional(),
        providerProposedAmount: z.number().positive().optional(),
        customerProposedAmount: z.number().positive().optional(),
    }),
});

const BidValidations = { createBidZodSchema, updateBidZodSchema };
export default BidValidations;
