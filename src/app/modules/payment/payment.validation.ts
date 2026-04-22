import { z } from 'zod';
import { ENUM_PAYMENT_STATUS } from './payment.enum';

// ✅ Create Payment Zod Schema
export const createPaymentZodSchema = z.object({
    body: z.object({
        provider: z.string({ required_error: 'Provider ID is required' }),
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address'),
        amount: z
            .number({ required_error: 'Amount is required' })
            .positive('Amount must be a positive number'),
        bankName: z
            .string({ required_error: 'Bank name is required' })
            .min(1, 'Bank name cannot be empty'),
        acNumber: z
            .string({ required_error: 'Account number is required' })
            .min(1, 'Account number cannot be empty'),
        completeDate: z.coerce.date({
            required_error: 'Complete date is required',
        }),
        status: z.nativeEnum(ENUM_PAYMENT_STATUS).optional(),
    }),
});

// ✅ Update Payment Zod Schema
export const updatePaymentZodSchema = z.object({
    body: z.object({
        provider: z.string().optional(),
        email: z.string().email('Invalid email address').optional(),
        amount: z.number().positive('Amount must be positive').optional(),
        bankName: z.string().optional(),
        acNumber: z.string().optional(),
        completeDate: z.coerce.date().optional(),
        status: z.nativeEnum(ENUM_PAYMENT_STATUS).optional(),
    }),
});

const PaymentValidations = {
    createPaymentZodSchema,
    updatePaymentZodSchema,
};

export default PaymentValidations;
