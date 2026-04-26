import { z } from 'zod';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import { ENUM_SERVICE_TYPE } from '../provider/provider.enum';
import { ENUM_TASK_STATUS } from './task.enum';

const objectId = z
    .string({
        required_error: 'ID is required',
        invalid_type_error: 'ID must be a string',
    })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

const locationSchema = z.object({
    type: z.literal('Point', {
        errorMap: () => ({ message: 'Location type must be "Point"' }),
    }),
    coordinates: z
        .array(z.number({ invalid_type_error: 'Coordinates must be numbers' }))
        .length(2, 'Coordinates must be [longitude, latitude]'),
});

const statusWithDateSchema = z.object({
    status: z.nativeEnum(ENUM_TASK_STATUS, {
        errorMap: () => ({ message: 'Invalid task status' }),
    }),
    date: z.coerce.date({
        invalid_type_error: 'Invalid date format',
    }),
});

const createTaskSchema = z.object({
    body: z.object({
        title: z
            .string({
                invalid_type_error: 'Title must be a string',
            })
            .optional()
            .default(''),

        serviceType: z.nativeEnum(ENUM_SERVICE_TYPE, {
            errorMap: () => ({ message: 'Invalid service type' }),
        }),

        budget: z
            .number({
                required_error: 'Budget is required',
                invalid_type_error: 'Budget must be a number',
            })
            .positive('Budget must be greater than 0'),

        taskStartDateTime: z.coerce
            .date({
                invalid_type_error: 'Invalid task start date',
            })
            .optional()
            .nullable(),

        acceptedBidAmount: z
            .number({
                invalid_type_error: 'Accepted bid must be a number',
            })
            .optional()
            .nullable(),

        customerPayingAmount: z
            .number({
                invalid_type_error: 'Customer paying amount must be a number',
            })
            .optional()
            .nullable(),

        providerEarningAmount: z
            .number({
                invalid_type_error: 'Provider earning must be a number',
            })
            .optional()
            .nullable(),

        status: z
            .nativeEnum(ENUM_TASK_STATUS, {
                errorMap: () => ({ message: 'Invalid task status' }),
            })
            .optional(),

        paymentStatus: z
            .nativeEnum(ENUM_PAYMENT_STATUS, {
                errorMap: () => ({ message: 'Invalid payment status' }),
            })
            .optional(),

        provider: objectId.optional().nullable(),

        customer: objectId.optional().nullable(),

        location: locationSchema.optional(),

        address: z
            .string({
                invalid_type_error: 'Address must be a string',
            })
            .optional()
            .default(''),

        description: z
            .string({
                required_error: 'Description is required',
                invalid_type_error: 'Description must be a string',
            })
            .min(1, 'Description cannot be empty'),

        task_attachments: z
            .array(
                z.string({
                    invalid_type_error: 'Attachment must be a string URL',
                })
            )
            .optional(),

        statusWithDate: z.array(statusWithDateSchema).optional(),

        transactionId: z
            .string({
                invalid_type_error: 'Transaction ID must be a string',
            })
            .optional()
            .nullable(),
    }),
});
const updateTaskSchema = z.object({
    body: z.object({
        title: z
            .string({
                invalid_type_error: 'Title must be a string',
            })
            .optional(),

        serviceType: z
            .nativeEnum(ENUM_SERVICE_TYPE, {
                errorMap: () => ({ message: 'Invalid service type' }),
            })
            .optional(),

        budget: z
            .number({
                invalid_type_error: 'Budget must be a number',
            })
            .positive('Budget must be greater than 0')
            .optional(),

        taskStartDateTime: z.coerce
            .date({
                invalid_type_error: 'Invalid task start date',
            })
            .optional()
            .nullable(),

        acceptedBidAmount: z
            .number({
                invalid_type_error: 'Accepted bid must be a number',
            })
            .optional()
            .nullable(),

        customerPayingAmount: z
            .number({
                invalid_type_error: 'Customer paying amount must be a number',
            })
            .optional()
            .nullable(),

        providerEarningAmount: z
            .number({
                invalid_type_error: 'Provider earning must be a number',
            })
            .optional()
            .nullable(),

        status: z
            .nativeEnum(ENUM_TASK_STATUS, {
                errorMap: () => ({ message: 'Invalid task status' }),
            })
            .optional(),

        paymentStatus: z
            .nativeEnum(ENUM_PAYMENT_STATUS, {
                errorMap: () => ({ message: 'Invalid payment status' }),
            })
            .optional(),

        provider: objectId.optional().nullable(),

        customer: objectId.optional().nullable(),

        location: locationSchema.optional(),

        address: z
            .string({
                invalid_type_error: 'Address must be a string',
            })
            .optional(),

        description: z
            .string({
                invalid_type_error: 'Description must be a string',
            })
            .min(1, 'Description cannot be empty')
            .optional(),

        task_attachments: z
            .array(
                z.string({
                    invalid_type_error: 'Attachment must be a string URL',
                })
            )
            .optional(),

        statusWithDate: z.array(statusWithDateSchema).optional(),

        transactionId: z
            .string({
                invalid_type_error: 'Transaction ID must be a string',
            })
            .optional()
            .nullable(),
    }),
});

const TaskValidations = {
    createTaskSchema,
    updateTaskSchema,
};

export default TaskValidations;
