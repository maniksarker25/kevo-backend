import { z } from 'zod';

// ✅ Create Feedback Zod Schema
export const createFeedbackZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),

        rating: z
            .number({ required_error: 'Rating is required' })
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5'),
        details: z.string().optional(),
    }),
});

// ✅ Update Feedback Zod Schema
export const updateFeedbackZodSchema = z.object({
    body: z.object({
        task: z.string().optional(),
        provider: z.string().optional(),
        customer: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        details: z.string().optional(),
    }),
});

const FeedbackValidations = {
    createFeedbackZodSchema,
    updateFeedbackZodSchema,
};

export default FeedbackValidations;
