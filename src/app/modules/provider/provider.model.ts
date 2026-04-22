/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from 'mongoose';
import { IProvider } from './provider.interface';

const providerSchema = new Schema<IProvider>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        profile_image: {
            type: String,
        },
        city: {
            type: String,
        },
        street: {
            type: String,
        },
        identificationDocumentType: {
            type: String,
            default: '',
        },
        identificationDocumentNumber: {
            type: String,
            default: '',
        },
        identification_document: {
            type: String,
            default: '',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isBankVerificationNumberApproved: {
            type: Boolean,
            default: false,
        },
        isIdentificationDocumentApproved: {
            type: Boolean,
            default: false,
        },
        referralCode: {
            type: String,
            unique: true,
        },
        address: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

providerSchema.statics.generateUniqueReferralCode = async function () {
    const generate = () =>
        Math.random().toString(36).substring(2, 7).toUpperCase();

    let code = generate();
    let exists = await this.findOne({ referralCode: code });

    while (exists) {
        code = generate();
        exists = await this.findOne({ referralCode: code });
    }

    return code;
};

providerSchema.pre('save', async function (next) {
    if (!this.referralCode) {
        this.referralCode = await (
            this.constructor as any
        ).generateUniqueReferralCode();
    }
    next();
});

export const Provider = model<IProvider>('Provider', providerSchema);
