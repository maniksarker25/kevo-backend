import { z } from 'zod';

// ✅ Create PromoUse Zod Schema
export const createPromoUseZodSchema = z.object({
    body: z.object({
        promo: z.string({ required_error: 'Promo ID is required' }),

        task: z.string({ required_error: 'task ID is required' }),
    }),
});

// ✅ Update PromoUse Zod Schema
export const updatePromoUseZodSchema = z.object({
    body: z.object({
        promo: z.string().optional(),
        customer: z.string().optional(),
        task: z.string().optional(),
    }),
});

const PromoUseValidations = {
    createPromoUseZodSchema,
    updatePromoUseZodSchema,
};

export default PromoUseValidations;
