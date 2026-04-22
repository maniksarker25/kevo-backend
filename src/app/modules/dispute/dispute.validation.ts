import { z } from 'zod';
import { ENUM_DISPUTE_REQUEST_TYPE, ENUM_DISPUTE_STATUS } from './dispute.enum';

// ✅ Create Dispute Zod Schema
export const createDisputeZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),
        requestType: z.nativeEnum(ENUM_DISPUTE_REQUEST_TYPE, {
            required_error: 'Request type is required',
        }),
        requestBy: z.string({
            required_error: 'RequestBy (User ID) is required',
        }),
        status: z
            .nativeEnum(ENUM_DISPUTE_STATUS)
            .default(ENUM_DISPUTE_STATUS.PENDING),
        extensionRequest: z.string().optional(),
        cancellationRequest: z.string().optional(),
        requestTo: z.string({
            required_error: 'RequestTo (User ID) is required',
        }),
    }),
});

// ✅ Update Dispute Zod Schema
export const updateDisputeZodSchema = z.object({
    body: z.object({
        task: z.string().optional(),
        requestType: z.nativeEnum(ENUM_DISPUTE_REQUEST_TYPE).optional(),
        requestBy: z.string().optional(),
        status: z.nativeEnum(ENUM_DISPUTE_STATUS).optional(),
        extensionRequest: z.string().optional(),
        cancellationRequest: z.string().optional(),
        requestTo: z.string().optional(),
    }),
});

const DisputeValidations = {
    createDisputeZodSchema,
    updateDisputeZodSchema,
};

export default DisputeValidations;
