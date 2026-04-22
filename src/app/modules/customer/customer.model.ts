/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from 'mongoose';
import { ICustomer } from './customer.interface';

const customerSchema = new Schema<ICustomer>(
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
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        profile_image: {
            type: String,
            default: '',
        },
        city: {
            type: String,
            default: '',
        },
        street: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },

        referralCode: {
            type: String,
            unique: true,
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

customerSchema.statics.generateUniqueReferralCode = async function () {
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

customerSchema.pre('save', async function (next) {
    if (!this.referralCode) {
        this.referralCode = await (
            this.constructor as any
        ).generateUniqueReferralCode();
    }
    next();
});

export const Customer = model<ICustomer>('Customer', customerSchema);
