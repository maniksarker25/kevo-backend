import { z } from 'zod';

// ✅ Create Question Zod Schema
export const createQuestionZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),
        details: z
            .string({ required_error: 'Details are required' })
            .min(1, 'Details cannot be empty'),
        question_image: z.string().optional(),
    }),
});

// ✅ Update Question Zod Schema
export const updateQuestionZodSchema = z.object({
    body: z.object({
        provider: z.string().optional(),
        task: z.string().optional(),
        details: z.string().min(1, 'Details cannot be empty').optional(),
        question_image: z.string().optional(),
    }),
});

const QuestionValidations = {
    createQuestionZodSchema,
    updateQuestionZodSchema,
};

export default QuestionValidations;
