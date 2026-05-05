/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { Provider } from '../provider/provider.model';
import SuperAdmin from '../superAdmin/superAdmin.model';
import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import { USER_ROLE } from '../user/user.constant';
import { Customer } from './customer.model';

const updateUserProfile = async (userData: JwtPayload, payload: any) => {
    if (payload.email || payload.phone) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can not change the email or phone number'
        );
    }
    if (userData.role == USER_ROLE.customer) {
        const user = await Customer.findById(userData.profileId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await Customer.findByIdAndUpdate(
            userData.profileId,
            payload,
            {
                new: true,
                runValidators: true,
            }
        );
        if (payload.profile_image && user.profile_image) {
            deleteFileFromS3(user.profile_image);
        }
        return result;
    } else if (userData.role == USER_ROLE.superAdmin) {
        const admin = await SuperAdmin.findById(userData.profileId);
        if (!admin) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await SuperAdmin.findByIdAndUpdate(
            userData.profileId,
            payload,
            { new: true, runValidators: true }
        );
        if (payload.profile_image && admin.profile_image) {
            deleteFileFromS3(admin.profile_image);
        }

        return result;
    } else if (userData.role == USER_ROLE.provider) {
        const provider = await Provider.findById(userData.profileId);
        if (!provider) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await Provider.findByIdAndUpdate(
            userData.profileId,
            payload,
            { new: true, runValidators: true }
        );
        if (payload.profile_image && provider.profile_image) {
            deleteFileFromS3(provider.profile_image);
        }

        return result;
    }
};

const getAllCustomerFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';
    const filters: any = {};
    const isBlocked =
        query.isBlocked !== undefined
            ? JSON.parse(query.isBlocked as string)
            : undefined;
    Object.keys(query).forEach((key) => {
        if (
            ![
                'searchTerm',
                'page',
                'limit',
                'sortBy',
                'sortOrder',
                'isBlocked',
            ].includes(key)
        ) {
            filters[key] = query[key];
        }
    });

    const searchMatchStage = searchTerm
        ? {
              $or: [
                  { name: { $regex: searchTerm, $options: 'i' } },
                  { email: { $regex: searchTerm, $options: 'i' } },
              ],
          }
        : {};

    const customer = await Customer.aggregate([
        {
            $match: {
                ...searchMatchStage,
                ...filters,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                    {
                        $project: {
                            isBlocked: 1,
                            isActive: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                user: { $arrayElemAt: ['$user', 0] },
            },
        },
        ...(isBlocked !== undefined
            ? [
                  {
                      $match: {
                          'user.isBlocked': isBlocked,
                      },
                  },
              ]
            : []),
        {
            $lookup: {
                from: 'tasks',
                localField: '_id',
                foreignField: 'customer',
                as: 'activeTasks',
                pipeline: [
                    {
                        $match: {
                            status: {
                                $in: [
                                    ENUM_TASK_STATUS.IN_PROGRESS,
                                    ENUM_TASK_STATUS.OPEN,
                                    ENUM_TASK_STATUS.ASSIGNED,
                                ],
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                activeTasks: { $size: '$activeTasks' },
            },
        },

        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ]);
    const result = customer[0]?.result || [];
    const total = customer[0]?.totalCount[0]?.total || 0;
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

const getSingleCustomer = async (id: string) => {
    const result = await Customer.findById(id).populate({
        path: 'user',
        select: 'isBlocked isAdminVerified isActive',
    });
    return result;
};

const customerHomeData = async (customerId: string) => {
    const assignedTask = await TaskModel.find({
        customer: customerId,
        $or: [
            { status: ENUM_TASK_STATUS.ASSIGNED },
            { status: ENUM_TASK_STATUS.OPEN },
        ],
    }).select(
        'title serviceType budget taskStartDateTime status address location'
    );

    const topProviders = await Provider.aggregate([
        {
            $lookup: {
                from: 'ratings',
                localField: '_id',
                foreignField: 'provider',
                as: 'ratings',
            },
        },

        {
            $addFields: {
                ratingCount: { $size: '$ratings' },
                avgRating: {
                    $cond: [
                        { $gt: [{ $size: '$ratings' }, 0] },
                        { $avg: '$ratings.rating' },
                        0, // 👈 IMPORTANT fallback
                    ],
                },
            },
        },

        {
            $addFields: {
                score: {
                    $add: [
                        { $multiply: ['$avgRating', 2] }, // rating weight
                        { $multiply: ['$ratingCount', 0.1] }, // trust weight
                    ],
                },
            },
        },

        {
            $sort: {
                score: -1,
                createdAt: -1,
            },
        },

        {
            $limit: 10,
        },

        {
            $project: {
                name: 1,
                profile_image: 1,
                email: 1,
                serviceTypes: 1,
                avgRating: 1,
                ratingCount: 1,
                score: 1,
                isIdentificationDocumentApproved: 1,
            },
        },
    ]);

    return {
        assignedTask,
        topProviders,
    };
};

const CustomerServices = {
    updateUserProfile,
    getAllCustomerFromDB,
    getSingleCustomer,
    customerHomeData,
};

export default CustomerServices;
