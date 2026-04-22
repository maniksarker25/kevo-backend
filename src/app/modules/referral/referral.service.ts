import { ENUM_REFERRAL_STATUS } from './referral.enum';
import referralModel from './referral.model';

const getAllReferralFromDB = async () => {
    const result = await referralModel.find();
    return result;
};
const updateReferralValueFromDB = async (id: string, value: number) => {
    const result = await referralModel.findByIdAndUpdate(
        id,
        {
            value: value,
        },
        { new: true }
    );
    return result;
};
const updateReferralStatusFromDB = async (id: string) => {
    const referral = await referralModel.findById(id);
    if (!referral) {
        throw new Error('Referral not found');
    }

    const newStatus =
        referral.status === ENUM_REFERRAL_STATUS.ACTIVE
            ? ENUM_REFERRAL_STATUS.INACTIVE
            : ENUM_REFERRAL_STATUS.ACTIVE;

    const updatedReferral = await referralModel.findByIdAndUpdate(
        id,
        { status: newStatus },
        { new: true }
    );

    return updatedReferral;
};

const ReferralServices = {
    getAllReferralFromDB,
    updateReferralValueFromDB,
    updateReferralStatusFromDB,
};
export default ReferralServices;
