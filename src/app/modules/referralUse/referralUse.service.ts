/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { platformChargePercentage } from '../../constant';
import AppError from '../../error/appError';
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import {
    ENUM_REFERRAL_FOR,
    ENUM_REFERRAL_STATUS,
} from '../referral/referral.enum';
import ReferralModel from '../referral/referral.model';
import { USER_ROLE } from '../user/user.constant';
import ReferralUseModel from './referralUse.model';

type TRole = 'customer' | 'provider';

const verifyReferralCodeFromDB = async (
    code: string,
    profileId: string,
    role: TRole
) => {
    if (role === USER_ROLE.customer) {
        const referrer = await Customer.findOne({ referralCode: code });

        if (!referrer) {
            throw new AppError(httpStatus.NOT_FOUND, 'Invalid referral code');
        }

        if (referrer._id.toString() === profileId) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'You cannot refer yourself'
            );
        }

        const referral = await ReferralModel.findOne({
            referralFor: ENUM_REFERRAL_FOR.CUSTOMER,
            status: ENUM_REFERRAL_STATUS.ACTIVE,
        });
        if (!referral)
            throw new AppError(
                httpStatus.NOT_FOUND,
                'Referral program not active'
            );

        // CHECK IF ALREADY REFERRED
        const alreadyReferred = await ReferralUseModel.findOne({
            referred: profileId,
        });

        if (alreadyReferred) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'You ARE already referred'
            );
        }

        const created = await ReferralUseModel.create({
            referrer: referrer._id,
            referrerFromModel: 'Customer',

            referred: profileId,
            referredFromModel: 'Customer',
            value: referral.value,
            referral: referral._id,
        });

        return created;
    } else if (role === USER_ROLE.provider) {
        const referrer = await Provider.findOne({ referralCode: code });

        if (!referrer) {
            throw new AppError(httpStatus.NOT_FOUND, 'Invalid referral code');
        }

        if (referrer._id.toString() === profileId) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'You cannot refer yourself'
            );
        }

        const referral = await ReferralModel.findOne({
            referralFor: ENUM_REFERRAL_FOR.PROVIDER,
            status: ENUM_REFERRAL_STATUS.ACTIVE,
        });

        if (!referral)
            throw new AppError(httpStatus.NOT_FOUND, 'Referral  not found');

        const alreadyReferred = await ReferralUseModel.findOne({
            referred: profileId,
        });

        if (alreadyReferred) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'You ARE already referred'
            );
        }

        const created = await ReferralUseModel.create({
            referrer: referrer._id,
            referrerFromModel: 'Provider',

            referred: profileId,
            referredFromModel: 'Provider',

            referral: referral._id,
        });

        return created;
    }
};

const getMyReferralFromDB = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
        {
            $match: {
                $or: [
                    { referrer: new mongoose.Types.ObjectId(profileId) },
                    { referred: new mongoose.Types.ObjectId(profileId) },
                ],
            },
        },
        {
            $addFields: {
                isMeReferrer: {
                    $cond: [
                        {
                            $eq: [
                                '$referrer',
                                new mongoose.Types.ObjectId(profileId),
                            ],
                        },
                        true,
                        false,
                    ],
                },
            },
        },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await ReferralUseModel.aggregate(pipeline);

    const result = aggResult[0]?.result || [];
    const total = aggResult[0]?.totalCount[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result,
    };
};

const getAllReferralUseFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await ReferralUseModel.find()
        .populate('referral referrer referred')
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({
            createdAt: -1,
        });

    const total = await ReferralUseModel.countDocuments();
    const totalPage = Math.ceil(total / limit);

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Referral uses not found');
    }

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result,
    };
};

const getReferralAndPlatformCharge = async (profileId: string) => {
    const referral = await ReferralUseModel.findOne({
        $or: [{ referred: profileId }, { referrer: profileId }],
        status: ENUM_REFERRAL_STATUS.ACTIVE,
    }).sort({ createdAt: 1 });

    return {
        referralDiscount: referral ? referral.value : 0,
        platformCharge: platformChargePercentage * 100,
    };
};
const ReferralUseServices = {
    verifyReferralCodeFromDB,
    getMyReferralFromDB,
    getAllReferralUseFromDB,
    getReferralAndPlatformCharge,
};
export default ReferralUseServices;
