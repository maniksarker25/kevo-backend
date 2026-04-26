import { z } from 'zod';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import { ENUM_SERVICE_TYPE } from '../provider/provider.enum';
import { ENUM_TASK_STATUS } from './task.enum';

const locationSchema = z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z
        .array(z.number())
        .length(2, 'Coordinates must be [lng, lat]'),
});

const statusWithDateSchema = z.object({
    status: z.nativeEnum(ENUM_TASK_STATUS),
    date: z.coerce.date(),
});

export const createTaskSchema = z.object({
    title: z.string().optional().default(''),

    serviceType: z.nativeEnum(ENUM_SERVICE_TYPE),

    budget: z.number(),

    taskStartDateTime: z.coerce.date().optional().nullable(),

    acceptedBidAmount: z.number().optional().nullable(),
    customerPayingAmount: z.number().optional().nullable(),
    providerEarningAmount: z.number().optional().nullable(),

    status: z.nativeEnum(ENUM_TASK_STATUS).optional(),

    paymentStatus: z.nativeEnum(ENUM_PAYMENT_STATUS).optional(),

    provider: z.string().optional().nullable(),
    customer: z.string().optional().nullable(),

    location: locationSchema.optional(),

    address: z.string().optional().default(''),
    city: z.string().optional().default(''),

    preferredDeliveryDateTime: z.coerce.date().optional().nullable(),

    description: z.string().min(1, 'Description is required'),

    task_attachments: z.array(z.string()).optional(),

    statusWithDate: z.array(statusWithDateSchema).optional(),

    transactionId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

const TaskValidations = {
    createTaskSchema,
    updateTaskSchema,
};

export default TaskValidations;
