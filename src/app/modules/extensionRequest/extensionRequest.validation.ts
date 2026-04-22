import { z } from 'zod';
import { ENUM_EXTENSION_REQUEST_STATUS } from './extensionRequest.enum';

export const createExtensionRequestZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),
        requestedBy: z.string().optional(),
        currentDate: z.coerce.date().optional(),
        requestedDateTime: z.coerce.date({
            required_error: 'Requested date is required',
        }),
        reason: z
            .string({ required_error: 'Reason is required' })
            .min(1, 'Reason cannot be empty'),
        status: z
            .nativeEnum(ENUM_EXTENSION_REQUEST_STATUS)
            .default(ENUM_EXTENSION_REQUEST_STATUS.PENDING),
        rejectDetails: z.string().optional(),
        reject_evidence: z.string().optional(),
        reviewedRequestAt: z.coerce.date().optional(),
    }),
});

export const updateExtensionRequestZodSchema = z.object({
    body: z.object({
        task: z.string().optional(),
        requestedBy: z.string().optional(),
        currentDate: z.coerce.date().optional(),
        requestedDateTime: z.coerce.date().optional(),
        reason: z.string().optional(),
        status: z.nativeEnum(ENUM_EXTENSION_REQUEST_STATUS).optional(),
        rejectDetails: z.string().optional(),
        reject_evidence: z.string().optional(),
        reviewedRequestAt: z.coerce.date().optional(),
    }),
});

const extensionRequestActionZodSchema = z.object({
    body: z.object({
        status: z.enum([
            ENUM_EXTENSION_REQUEST_STATUS.ACCEPTED,
            ENUM_EXTENSION_REQUEST_STATUS.REJECTED,
        ]),

        rejectDetails: z.string().optional(),

        reject_evidence: z
            .string()
            .optional()
            .describe('Optional image URL or file reference'),
    }),
});

const ExtensionRequestValidations = {
    createExtensionRequestZodSchema,
    updateExtensionRequestZodSchema,
    extensionRequestActionZodSchema,
};

export default ExtensionRequestValidations;
