import { z } from 'zod';
import { ENUM_CANCELLATION_REQUEST_STATUS } from './cancellationRequest.enum';

export const createCancellationRequestZodSchema = z.object({
    body: z.object({
        task: z.string({ required_error: 'Task ID is required' }),
        requestedBy: z.string().optional(),
        currentDate: z.coerce.date().optional(),

        reason: z
            .string({ required_error: 'Reason is required' })
            .min(1, 'Reason cannot be empty'),
        status: z
            .nativeEnum(ENUM_CANCELLATION_REQUEST_STATUS)
            .default(ENUM_CANCELLATION_REQUEST_STATUS.PENDING),
        rejectDetails: z.string().optional(),
        reject_evidence: z.string().optional(),
        reviewedRequestAt: z.coerce.date().optional(),
    }),
});

export const updateCancellationRequestZodSchema = z.object({
    body: z.object({
        requestedBy: z.string().optional(),
        currentDate: z.coerce.date().optional(),

        reason: z
            .string({ required_error: 'Reason is required' })
            .min(1, 'Reason cannot be empty')
            .optional(),
        rejectDetails: z.string().optional(),
        reject_evidence: z.string().optional(),
        reviewedRequestAt: z.coerce.date().optional(),
    }),
});

const acceptRejectZodSchema = z.object({
    body: z
        .object({
            status: z.enum(
                [
                    ENUM_CANCELLATION_REQUEST_STATUS.ACCEPTED,
                    ENUM_CANCELLATION_REQUEST_STATUS.REJECTED,
                ],
                {
                    required_error: 'status is required',
                }
            ),

            // For REJECTED case only
            rejectDetails: z.string().optional(),
            reject_evidence: z.string().optional(),
        })
        .refine(
            (data) => {
                if (data.status === ENUM_CANCELLATION_REQUEST_STATUS.REJECTED) {
                    return !!data.rejectDetails;
                }
                return true;
            },
            {
                message: 'rejectDetails is required when status is REJECTED',
                path: ['rejectDetails'],
            }
        ),
});

const resolveByAdminZodSchema = z.object({
    body: z.object({
        status: z.enum(
            [
                ENUM_CANCELLATION_REQUEST_STATUS.ACCEPTED,
                ENUM_CANCELLATION_REQUEST_STATUS.REJECTED,
            ],
            {
                required_error: 'status is required',
            }
        ),
        payTo: z.enum(['Customer', 'Provider']).optional(),
    }),
});

const CancellationRequestValidations = {
    createCancellationRequestZodSchema,
    updateCancellationRequestZodSchema,
    acceptRejectZodSchema,
    resolveByAdminZodSchema,
};

export default CancellationRequestValidations;
