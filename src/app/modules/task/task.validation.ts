import { z } from 'zod';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import {
    ENUM_DONE_BY,
    ENUM_SCHEDULE_TYPE,
    ENUM_TASK_STATUS,
} from './task.enum';

const locationSchema = z
    .object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional();

// Regex for 24-hour time format (HH:mm)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createTaskZodSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: 'Title is required' })
            .min(1, 'Title cannot be empty'),
        category: z.string().optional(), // ObjectId
        budget: z
            .number({ required_error: 'Budget is required' })
            .positive('Budget must be positive'),
        status: z.nativeEnum(ENUM_TASK_STATUS).optional(),
        isDeleted: z.boolean().optional(),
        paymentStatus: z.nativeEnum(ENUM_PAYMENT_STATUS).optional(),
        provider: z.string().optional(),
        customer: z.string().optional(),
        payOn: z.string().optional(),
        doneBy: z.nativeEnum(ENUM_DONE_BY).optional(),
        location: locationSchema,
        scheduleType: z.nativeEnum(ENUM_SCHEDULE_TYPE).optional(),
        preferredDeliveryDateTime: z.coerce.date().optional(),

        description: z
            .string({ required_error: 'Description is required' })
            .min(1, 'Description cannot be empty'),
        attachments: z.array(z.string()).optional(),
    }),
});

export const updateTaskZodSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        category: z.string().optional(),
        budget: z.number().positive().optional(),
        status: z.nativeEnum(ENUM_TASK_STATUS).optional(),
        isDeleted: z.boolean().optional(),
        paymentStatus: z.nativeEnum(ENUM_PAYMENT_STATUS).optional(),
        provider: z.string().optional(),
        customer: z.string().optional(),
        payOn: z.string().optional(),
        doneBy: z.nativeEnum(ENUM_DONE_BY).optional(),
        location: locationSchema,
        scheduleType: z.nativeEnum(ENUM_SCHEDULE_TYPE).optional(),
        preferredDate: z.coerce.date().optional(),

        //  Same 24-hour validation for update
        preferredTime: z
            .string()
            .regex(timeRegex, {
                message: 'Preferred time must be in 24-hour format (HH:mm)',
            })
            .optional(),

        description: z.string().min(1).optional(),
        attachments: z.array(z.string()).optional(),
    }),
});

const TaskValidations = {
    createTaskZodSchema,
    updateTaskZodSchema,
};

export default TaskValidations;
