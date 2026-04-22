import mongoose from 'mongoose';
import {
    ENUM_REFERRAL_FOR,
    ENUM_REFERRAL_STATUS,
} from '../modules/referral/referral.enum';
import ReferralModel from '../modules/referral/referral.model';

const seedReferral = async () => {
    const existingReferrals = await ReferralModel.find({
        referralFor: { $in: Object.values(ENUM_REFERRAL_FOR) },
    });

    const hasCustomerReferral = existingReferrals.some(
        (ref) => ref.referralFor === ENUM_REFERRAL_FOR.CUSTOMER
    );

    const hasProviderReferral = existingReferrals.some(
        (ref) => ref.referralFor === ENUM_REFERRAL_FOR.PROVIDER
    );

    if (hasCustomerReferral && hasProviderReferral) {
        console.log('Both referrals exist — skipping.');
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const payloads = [];

        if (!hasCustomerReferral) {
            payloads.push({
                value: 50, // default or dynamic
                referralFor: ENUM_REFERRAL_FOR.CUSTOMER,
                status: ENUM_REFERRAL_STATUS.INACTIVE,
            });
        }

        if (!hasProviderReferral) {
            payloads.push({
                value: 50, // default or dynamic
                referralFor: ENUM_REFERRAL_FOR.PROVIDER,
                status: ENUM_REFERRAL_STATUS.INACTIVE,
            });
        }

        if (payloads.length > 0) {
            await ReferralModel.insertMany(payloads, { session });
            console.log(
                'Referral(s) created successfully:',
                payloads.map((p) => p.referralFor)
            );
        }

        await session.commitTransaction();
        session.endSession();

        return payloads;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export default seedReferral;
