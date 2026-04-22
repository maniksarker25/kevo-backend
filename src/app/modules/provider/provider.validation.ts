import { z } from 'zod';

// ✅ Update Provider Zod Schema
export const updateProviderZodSchema = z.object({
    body: z.object({
        user: z.string().optional(),
        name: z.string().min(1).optional(),
        phone: z.string().min(5).optional(),
        email: z.string().email('Invalid email address').optional(),
        profile_image: z.string().optional(),
        city: z.string().optional(),
        street: z.string().optional(),
        identificationDocumentType: z.string().optional(),
        identificationDocumentNumber: z.string().optional(),
        identification_document: z.string().optional(),
        bankVerificationNumber: z.string().optional(),
        isVerified: z.boolean().optional(),
        isBankVerificationNumberApproved: z.boolean().optional(),
        isIdentificationDocumentApproved: z.boolean().optional(),
    }),
});

const completeIdentityVerificationZodSchema = z.object({
    body: z.object({
        identificationDocumentType: z
            .string()
            .min(1, 'Identification document type is required'),
        identificationDocumentNumber: z
            .string()
            .min(1, 'Identification document number is required'),
    }),
});

const verifyBVNZodSchema = z.object({
    body: z.object({
        bvn: z.string().min(1, 'Bank Verification Number is required'),
    }),
});

const ProviderValidations = {
    updateProviderZodSchema,
    completeIdentityVerificationZodSchema,
    verifyBVNZodSchema,
};

export default ProviderValidations;
