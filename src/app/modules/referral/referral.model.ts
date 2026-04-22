import { model, Schema } from 'mongoose';
import { IReferral } from './referral.interface';
import { ENUM_REFERRAL_FOR, ENUM_REFERRAL_STATUS } from './referral.enum';

const referralSchema = new Schema<IReferral>(
    {
        value: {
            type: Number,
            required: true,
        },
        referralFor: {
            type: String,
            enum: Object.values(ENUM_REFERRAL_FOR),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_REFERRAL_STATUS),
            default: ENUM_REFERRAL_STATUS.ACTIVE,
        },
    },
    { timestamps: true }
);

const ReferralModel = model<IReferral>('Referral', referralSchema);
export default ReferralModel;
