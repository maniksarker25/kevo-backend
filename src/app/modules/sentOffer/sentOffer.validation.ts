import { z } from 'zod';

// ✅ Create SentOffer Zod Schema
export const createSentOfferZodSchema = z.object({
    body: z.object({
        provider: z.string({ required_error: 'Provider ID is required' }),
        service: z.string({ required_error: 'Service ID is required' }),
        customer: z.string({ required_error: 'Customer ID is required' }),
    }),
});

// ✅ Update SentOffer Zod Schema
export const updateSentOfferZodSchema = z.object({
    body: z.object({
        provider: z.string().optional(),
        service: z.string().optional(),
        customer: z.string().optional(),
    }),
});

const SentOfferValidations = {
    createSentOfferZodSchema,
    updateSentOfferZodSchema,
};

export default SentOfferValidations;
