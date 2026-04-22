import { z } from 'zod';
import { ENUM_REFERRAL_USE_STATUS } from './referralUse.enum';

// ✅ Create Referral Use Zod Schema
const createReferralUseZodSchema = z.object({
    body: z.object({
        referrer: z.string({
            required_error: 'Referrer ID is required',
            invalid_type_error: 'Referrer must be a string',
        }),
        referred: z.string({
            required_error: 'Referred ID is required',
            invalid_type_error: 'Referred must be a string',
        }),
        referral: z.string({
            required_error: 'Referral ID is required',
            invalid_type_error: 'Referral must be a string',
        }),
        status: z
            .nativeEnum(ENUM_REFERRAL_USE_STATUS, {
                errorMap: () => ({ message: 'Invalid status value' }),
            })
            .optional(),
    }),
});
const verifyReferralCodeZodSchema = z.object({
    body: z.object({
        code: z.string({ required_error: 'Code Missing' }),
    }),
});

// ✅ Update Referral Use Zod Schema
const updateReferralUseZodSchema = z.object({
    body: z.object({
        referrer: z.string().optional(),
        referred: z.string().optional(),
        status: z.nativeEnum(ENUM_REFERRAL_USE_STATUS).optional(),
        referral: z.string().optional(),
    }),
});

const ReferralUseValidations = {
    createReferralUseZodSchema,
    updateReferralUseZodSchema,
    verifyReferralCodeZodSchema,
};

export default ReferralUseValidations;
