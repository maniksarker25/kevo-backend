import { z } from 'zod';
import { ENUM_DISCOUNT_TYPE, ENUM_PROMO_STATUS } from './promo.enum';

// ✅ Create Promo Zod Schema
const createPromoZodSchema = z.object({
    body: z.object({
        promoCode: z
            .string({ required_error: 'Promo code is required' })
            .min(1, 'Promo code cannot be empty'),
        promoType: z
            .string({ required_error: 'Promo type is required' })
            .min(1, 'Promo type cannot be empty'),
        discountType: z.nativeEnum(ENUM_DISCOUNT_TYPE, {
            required_error: 'Discount type is required',
        }),
        discountNum: z
            .number({ required_error: 'Discount number is required' })
            .positive('Discount must be positive'),
        limit: z
            .number({ required_error: 'Limit is required' })
            .positive('Limit must be positive'),
        startDate: z.coerce.date({ required_error: 'Start date is required' }),
        endDate: z.coerce.date({ required_error: 'End date is required' }),
        status: z.nativeEnum(ENUM_PROMO_STATUS).optional(),
        usesDate: z.coerce.date().optional(),
    }),
});

// ✅ Update Promo Zod Schema
const updatePromoZodSchema = z.object({
    body: z.object({
        promoCode: z.string().optional(),
        promoType: z.string().optional(),
        discountType: z.nativeEnum(ENUM_DISCOUNT_TYPE).optional(),
        discountNum: z
            .number()
            .positive('Discount must be positive')
            .optional(),
        limit: z.number().positive('Limit must be positive').optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        status: z.nativeEnum(ENUM_PROMO_STATUS).optional(),
        usesDate: z.coerce.date().optional(),
    }),
});
const verifyPromoZodSchema = z.object({
    body: z.object({
        promoCode: z.string({ required_error: 'Promo code is required' }),
    }),
});

const PromoValidations = {
    createPromoZodSchema,
    updatePromoZodSchema,
    verifyPromoZodSchema,
};

export default PromoValidations;
