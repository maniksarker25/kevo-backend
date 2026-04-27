/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../../error/appError';
import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import { User } from '../user/user.model';
import { IBid } from './bid.interface';
import BidModel from './bid.model';

const createBidIntoDB = async (userData: JwtPayload, payload: IBid) => {
    const user = await User.findById(userData.id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (!user.isAdminVerified) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Your account is not verified by admin yet'
        );
    }

    const isExits = await BidModel.findOne({
        provider: userData.profileId,
        task: payload.task,
    });
    if (isExits) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You have already placed a bid for this task'
        );
    }
    const userId = userData.profileId;
    const task: any = await TaskModel.findById(payload.task).select('status');

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    if (task.status !== ENUM_TASK_STATUS.OPEN) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Bidding is closed for this task'
        );
    }

    const result = await BidModel.create({ ...payload, provider: userId });
    return result;
};

const getBidsByTaskIDFromDB = async (
    taskId: string,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortBy: any = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const pipeline: any[] = [
        {
            $match: {
                task: new mongoose.Types.ObjectId(taskId),
            },
        },

        {
            $lookup: {
                from: 'providers',
                localField: 'provider',
                foreignField: '_id',
                as: 'provider',
            },
        },
        { $unwind: '$provider' },

        {
            $lookup: {
                from: 'feedbacks',
                let: { providerId: '$provider._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$provider', '$$providerId'] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalRatingCount: { $sum: 1 },
                            avgRating: { $avg: '$rating' },
                        },
                    },
                ],
                as: 'ratingStats',
            },
        },

        {
            $addFields: {
                'provider.totalRatingCount': {
                    $ifNull: [
                        { $arrayElemAt: ['$ratingStats.totalRatingCount', 0] },
                        0,
                    ],
                },
                'provider.avgRating': {
                    $ifNull: [
                        { $arrayElemAt: ['$ratingStats.avgRating', 0] },
                        0,
                    ],
                },
            },
        },

        {
            $project: {
                _id: 1,
                price: 1,
                details: 1,
                task: 1,
                providerProposedAmount: 1,
                customerProposedAmount: 1,
                createdAt: 1,
                updatedAt: 1,

                provider: {
                    _id: '$provider._id',
                    name: '$provider.name',
                    email: '$provider.email',
                    profile_image: '$provider.profile_image',
                    totalRatingCount: '$provider.totalRatingCount',
                    avgRating: '$provider.avgRating',
                    serviceTypes: '$provider.serviceTypes',
                },
            },
        },

        { $sort: { [sortBy]: sortOrder } },

        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await BidModel.aggregate(pipeline);

    const result = aggResult[0]?.result || [];
    const total = aggResult[0]?.totalCount[0]?.total || 0;

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        result,
    };
};

const deleteBidFromDB = async (id: string, profileId: string) => {
    const result = await BidModel.findOneAndDelete({
        _id: id,
        provider: profileId,
    });
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Bid not found');
    }
    return result;
};

const updateBidIntoDB = async (
    bidId: string,
    profileId: string,
    payload: Partial<IBid>
) => {
    const bid = await BidModel.findOne({ _id: bidId, provider: profileId });
    if (!bid) {
        throw new AppError(httpStatus.NOT_FOUND, 'Bid not found');
    }
    const updateBid = await BidModel.findByIdAndUpdate(
        bidId,
        { ...payload },
        { new: true }
    );
    return updateBid;
};
const BidServices = {
    createBidIntoDB,
    deleteBidFromDB,
    getBidsByTaskIDFromDB,
    updateBidIntoDB,
};
export default BidServices;
