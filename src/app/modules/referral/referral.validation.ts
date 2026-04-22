import { z } from 'zod';
import { ENUM_REFERRAL_FOR, ENUM_REFERRAL_STATUS } from './referral.enum';

// ✅ Create Referral Zod Schema
export const createReferralZodSchema = z.object({
    body: z.object({
        value: z
            .number({ required_error: 'Value is required' })
            .positive('Value must be positive'),
        referralFor: z.nativeEnum(ENUM_REFERRAL_FOR, {
            required_error: 'ReferelFor is required',
        }),
        status: z.nativeEnum(ENUM_REFERRAL_STATUS).optional(),
    }),
});

// ✅ Update Referral Zod Schema
export const updateReferralZodSchema = z.object({
    body: z.object({
        value: z.number().positive('Value must be positive').optional(),
        referralFor: z.nativeEnum(ENUM_REFERRAL_FOR).optional(),
        status: z.nativeEnum(ENUM_REFERRAL_STATUS).optional(),
    }),
});
export const updateReferralValueZodSchema = z.object({
    body: z.object({
        value: z.number().positive('Value must be positive'),
    }),
});

const ReferralValidations = {
    createReferralZodSchema,
    updateReferralZodSchema,
    updateReferralValueZodSchema,
};

export default ReferralValidations;
