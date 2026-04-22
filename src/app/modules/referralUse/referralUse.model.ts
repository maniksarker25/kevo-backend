import { model, Schema } from 'mongoose';
import { ENUM_REFERRAL_USE_STATUS } from './referralUse.enum';
import { IReferralUse } from './referralUse.interface';

const referralUseSchema = new Schema<IReferralUse>(
    {
        referrer: {
            type: Schema.Types.ObjectId,
            refPath: 'referrerFromModel',
            required: true,
        },
        referrerFromModel: {
            type: String,
            required: true,
            enum: ['Customer', 'Provider'],
        },
        referred: {
            type: Schema.Types.ObjectId,
            refPath: 'referredFromModel',
            required: true,
        },
        referredFromModel: {
            type: String,
            required: true,
            enum: ['Customer', 'Provider'],
        },
        status: {
            type: String,
            enum: Object.values(ENUM_REFERRAL_USE_STATUS),
            default: ENUM_REFERRAL_USE_STATUS.ACTIVE,
        },
        referral: {
            type: Schema.Types.ObjectId,
            ref: 'Referral',
            required: true,
        },
        value: {
            type: Number,
            required: true,
        },
        appliedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const ReferralUseModel = model<IReferralUse>('ReferralUse', referralUseSchema);
export default ReferralUseModel;
