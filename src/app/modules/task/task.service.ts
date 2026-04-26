/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ITask } from './task.interface';

import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { sendSinglePushNotification } from '../../helper/sendPushNotification';
import { buildDateRangesByType } from '../../utilities/buildDateRangeByType';
import { default as bidModel, default as BidModel } from '../bid/bid.model';
import { ENUM_NOTIFICATION_TYPE } from '../notification/notification.enum';
import Notification from '../notification/notification.model';
import { USER_ROLE } from '../user/user.constant';
import { User } from '../user/user.model';
import { ENUM_TASK_STATUS } from './task.enum';
import TaskModel from './task.model';
const ALL_STATUSES = ['OPEN_FOR_BID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const createTaskIntoDB = async (
    userData: JwtPayload,
    payload: Partial<ITask>
) => {
    const profileId = userData.profileId;

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
    if (payload.provider) {
        payload.status = ENUM_TASK_STATUS.PRIVATE;
    }
    try {
        const createdTask = await TaskModel.create({
            ...payload,
            customer: profileId,
        });

        const result = await TaskModel.findById(createdTask._id).populate(
            'category'
        );

        return result;
    } catch (err) {
        console.error('Failed to send task create admin notification:', err);
        throw err;
    }
};

const updateTask = async (profileId: string, id: string, payload: ITask) => {
    const task = await TaskModel.findOne({ customer: profileId, _id: id });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    const bid = await BidModel.findOne({ task: id });
    if (bid) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Freelancer already bid for that task so you are not able to update it'
        );
    }
    if (payload.task_attachments) {
        payload.task_attachments = [
            ...task.task_attachments,
            ...payload.task_attachments,
        ];
    } else {
        payload.task_attachments = [...task.task_attachments];
    }
    if (payload?.deletedImages) {
        payload.task_attachments = payload.task_attachments.filter(
            (url) => !payload?.deletedImages?.includes(url)
        );
    }

    const result = await TaskModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.deletedImages) {
        for (const image of payload.deletedImages) {
            deleteFileFromS3(image);
        }
    }

    return result;
};

const getAllTaskFromDB = async (
    userData: JwtPayload,
    query: Record<string, any>
) => {
    if (
        userData?.role &&
        (userData.role == USER_ROLE.admin ||
            userData.role == USER_ROLE.superAdmin)
    ) {
        const {
            page = 1,
            limit = 10,
            status,
            serviceType,
            provider,
            customer,
            paymentStatus,
            scheduleType,
            doneBy,
            search,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        /* ------------------ MATCH STAGE ------------------ */

        const matchStage: any = {
            isDeleted: false,
        };

        if (status) matchStage.status = status;
        if (paymentStatus) matchStage.paymentStatus = paymentStatus;
        if (scheduleType) matchStage.scheduleType = scheduleType;
        if (doneBy) matchStage.doneBy = doneBy;

        if (serviceType) matchStage.serviceType = serviceType;
        if (provider)
            matchStage.provider = new mongoose.Types.ObjectId(provider);

        if (customer)
            matchStage.customer = new mongoose.Types.ObjectId(customer);

        /* ------------------ DATE FILTER ------------------ */

        const { currentStart, currentEnd, previousStart, previousEnd } =
            buildDateRangesByType(query);

        if (currentStart && currentEnd) {
            matchStage.createdAt = {
                $gte: currentStart,
                $lte: currentEnd,
            };
        }

        // Custom override
        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        /* ------------------ PIPELINE ------------------ */

        const pipeline: any[] = [
            { $match: matchStage },

            /* ---------- LOOKUPS ---------- */

            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },

            {
                $lookup: {
                    from: 'customers',
                    localField: 'customer',
                    foreignField: '_id',
                    as: 'customer',
                    pipeline: [
                        { $project: { name: 1, profile_image: 1, email: 1 } },
                    ],
                },
            },
            { $unwind: '$customer' },

            {
                $lookup: {
                    from: 'providers',
                    localField: 'provider',
                    foreignField: '_id',
                    as: 'provider',
                    pipeline: [
                        { $project: { name: 1, profile_image: 1, email: 1 } },
                    ],
                },
            },
            { $unwind: '$provider' },

            ...(search
                ? [
                      {
                          $match: {
                              $or: [
                                  { title: { $regex: search, $options: 'i' } },
                                  {
                                      'customer.name': {
                                          $regex: search,
                                          $options: 'i',
                                      },
                                  },
                              ],
                          },
                      },
                  ]
                : []),

            {
                $facet: {
                    /* ---------- PAGINATION ---------- */
                    meta: [
                        { $count: 'total' },
                        {
                            $addFields: {
                                page: Number(page),
                                limit: Number(limit),
                            },
                        },
                    ],

                    result: [
                        {
                            $sort: {
                                [sortBy]: sortOrder === 'asc' ? 1 : -1,
                            },
                        },
                        { $skip: (Number(page) - 1) * Number(limit) },
                        { $limit: Number(limit) },
                    ],

                    /* ---------- CURRENT STATS ---------- */
                    currentStats: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 },
                            },
                        },
                    ],

                    /* ---------- PREVIOUS STATS ---------- */
                    previousStats:
                        previousStart && previousEnd
                            ? [
                                  {
                                      $match: {
                                          createdAt: {
                                              $gte: previousStart,
                                              $lte: previousEnd,
                                          },
                                      },
                                  },
                                  {
                                      $group: {
                                          _id: '$status',
                                          count: { $sum: 1 },
                                      },
                                  },
                              ]
                            : [],
                },
            },
        ];

        /* ------------------ EXECUTION ------------------ */

        const [data] = await TaskModel.aggregate(pipeline);

        const meta = data.meta[0] || {
            total: 0,
            page: Number(page),
            limit: Number(limit),
        };

        const totalPage = Math.ceil(meta.total / meta.limit);

        /* ------------------ NORMALIZE STATS ------------------ */

        const stats = ALL_STATUSES.map((status: string) => {
            const current = data.currentStats.find(
                (s: any) => s._id === status
            );
            const previous = data.previousStats.find(
                (s: any) => s._id === status
            );

            const currentCount = current?.count || 0;
            const previousCount = previous?.count || 0;

            let percentage = 0;

            if (previousCount === 0 && currentCount > 0) {
                percentage = 100;
            } else if (previousCount > 0) {
                percentage =
                    ((currentCount - previousCount) / previousCount) * 100;
            }

            return {
                status,
                count: currentCount,
                changePercentage: Number(percentage.toFixed(2)),
                trend:
                    percentage > 0
                        ? 'increase'
                        : percentage < 0
                          ? 'decrease'
                          : 'no-change',
            };
        });

        /* ------------------ FINAL RESPONSE ------------------ */

        return {
            meta: {
                ...meta,
                totalPage,
            },
            stats,
            result: data.result,
        };
    } else {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchTerm = query.searchTerm || '';
        const maxDistance = Number(query.maxDistance) * 1000 || 5000;
        const minPrice = Number(query.minPrice) || null;
        const maxPrice = Number(query.maxPrice) || null;
        const filters: Record<string, any> = {};
        const isPopular = query.popular === 'true';
        Object.keys(query).forEach((key) => {
            if (
                ![
                    'searchTerm',
                    'page',
                    'limit',
                    'sortBy',
                    'sortOrder',
                    'minPrice',
                    'maxPrice',
                    'popular',
                ].includes(key)
            ) {
                filters[key] = query[key];
            }
        });

        if (query.category) {
            filters.category = new mongoose.Types.ObjectId(query.category);
        }

        const searchMatchStage = searchTerm
            ? {
                  $or: [
                      { title: { $regex: searchTerm, $options: 'i' } },
                      { description: { $regex: searchTerm, $options: 'i' } },
                  ],
              }
            : {};

        if (minPrice !== null || maxPrice !== null) {
            filters.budget = {};
            if (minPrice !== null) filters.budget.$gte = minPrice;
            if (maxPrice !== null) filters.budget.$lte = maxPrice;
        }

        // Sorting
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        // const sortStage = { [sortBy]: sortOrder };
        const sortStage = isPopular
            ? { totalOffer: -1 }
            : { [sortBy]: sortOrder };

        const pipeline: any[] = [
            {
                $match: {
                    ...filters,
                    ...searchMatchStage,
                    isDeleted: false,
                    provider: null,
                },
            },
            {
                $lookup: {
                    from: 'bids',
                    localField: '_id',
                    foreignField: 'task',
                    as: 'bids',
                },
            },
            {
                $addFields: {
                    totalOffer: { $size: '$bids' },
                },
            },

            {
                $lookup: {
                    from: 'customers',
                    localField: 'customer',
                    foreignField: '_id',
                    as: 'customer',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                profile_image: 1,
                            },
                        },
                        {
                            $unwind: {
                                path: '$user',
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    bids: 0,
                },
            },
            { $sort: sortStage },
            {
                $facet: {
                    result: [{ $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: 'total' }],
                },
            },
        ];

        // 🗺️ Geo filter (if user sends coordinates)
        if (query.latitude && query.longitude) {
            pipeline.unshift({
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(query.longitude as string),
                            parseFloat(query.latitude as string),
                        ],
                    },
                    distanceField: 'distance',
                    maxDistance: maxDistance,
                    spherical: true,
                },
            });
            pipeline.push({
                $sort: { distance: 1 },
            });
        }

        const aggResult = await TaskModel.aggregate(pipeline);
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
    }
};
const getMyTaskFromDB = async (
    userData: JwtPayload,
    query: Record<string, any>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';
    const minPrice = Number(query.minPrice) || null;
    const maxPrice = Number(query.maxPrice) || null;
    const matchStage: any = {};
    if (userData.role == USER_ROLE.customer) {
        matchStage.customer = new mongoose.Types.ObjectId(userData.profileId);
    }
    if (
        query.status != ENUM_TASK_STATUS.OPEN &&
        query.status != 'bidMade' &&
        userData.role == USER_ROLE.provider
    ) {
        matchStage.provider = new mongoose.Types.ObjectId(userData.profileId);
    }

    const filters: Record<string, any> = {};
    Object.keys(query).forEach((key) => {
        if (
            !['searchTerm', 'page', 'limit', 'sortBy', 'sortOrder'].includes(
                key
            )
        ) {
            filters[key] = query[key];
        }
    });

    if (query.category) {
        filters.category = new mongoose.Types.ObjectId(query.category);
    }

    const searchMatchStage = searchTerm
        ? {
              $or: [
                  { title: { $regex: searchTerm, $options: 'i' } },
                  { description: { $regex: searchTerm, $options: 'i' } },
              ],
          }
        : {};

    if (minPrice !== null || maxPrice !== null) {
        filters.budget = {};
        if (minPrice !== null) filters.budget.$gte = minPrice;
        if (maxPrice !== null) filters.budget.$lte = maxPrice;
    }
    if (userData.role === USER_ROLE.provider) {
        if (query.status === 'bidMade') {
            // Do NOT put inside filters!
            delete filters.status;
        }

        if (query.status === 'bidReceived') {
            filters.status = ENUM_TASK_STATUS.OPEN;
        }
    }

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortStage = { [sortBy]: sortOrder };

    const pipeline: any[] = [
        {
            $match: {
                ...matchStage,
                ...filters,
                ...searchMatchStage,
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: 'bids',
                localField: '_id',
                foreignField: 'task',
                as: 'bids',
            },
        },
        // Apply "bidMade" filter here
        ...(query.status === 'bidMade'
            ? [
                  {
                      $match: {
                          'bids.provider': new mongoose.Types.ObjectId(
                              userData.profileId
                          ),
                      },
                  },
              ]
            : []),

        {
            $addFields: {
                totalOffer: { $size: '$bids' },
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customer',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            profile_image: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
        },
        {
            $project: {
                bids: 0,
            },
        },
        { $sort: sortStage },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await TaskModel.aggregate(pipeline);
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
const getSingleTaskFromDB = async (userId: string, id: string) => {
    const pipeline: any[] = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: 'bids',
                localField: '_id',
                foreignField: 'task',
                as: 'bids',
            },
        },
        {
            $addFields: {
                totalOffer: { $size: '$bids' },
            },
        },
        {
            $lookup: {
                from: 'bids',
                let: { taskId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$task', '$$taskId'] },
                                    {
                                        $eq: [
                                            '$provider',
                                            new mongoose.Types.ObjectId(userId),
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    { $project: { _id: 1 } },
                ],
                as: 'userBid',
            },
        },
        {
            $addFields: {
                isBid: { $gt: [{ $size: '$userBid' }, 0] },
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customer',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            profile_image: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'providers',
                localField: 'provider',
                foreignField: '_id',
                as: 'provider',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            profile_image: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
        },
        {
            $project: {
                bids: 0,
                userBid: 0,
            },
        },
    ];

    const result = await TaskModel.aggregate(pipeline);
    return result[0] || null;
};

const deleteTaskFromDB = async (id: string, currentUserId: string) => {
    const taskData = await TaskModel.findOne({
        _id: id,
        customer: currentUserId,
    });

    if (!taskData) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    await Promise.all([
        bidModel.deleteMany({ task: taskData._id }),
        TaskModel.findByIdAndDelete(id),
    ]);

    return taskData;
};

const acceptOfferByProvider = async (taskId: string, currentUserId: string) => {
    const task = await TaskModel.findById(taskId);

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    if (task.provider?.toString() !== currentUserId) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized to accept this task'
        );
    }
    if (
        task.status === ENUM_TASK_STATUS.IN_PROGRESS ||
        task.status === ENUM_TASK_STATUS.COMPLETED
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Task is already ${task.status.toLowerCase()}`
        );
    }

    task.status = ENUM_TASK_STATUS.IN_PROGRESS;

    await task.save();

    return task;
};

const rejectOfferByProvider = async (taskId: string, currentUserId: string) => {
    const task = await TaskModel.findOne({
        _id: taskId,
        provider: currentUserId,
    });

    if (!task) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Task not found or this is not your task'
        );
    }

    task.provider = null;
    task.status = ENUM_TASK_STATUS.OPEN;
    await task.save();
    await Notification.create({
        title: 'Offer rejected by Provider',
        message: `Provider Rejected your offer, now your task is open for bid for other freelancers`,
        receiver: task.customer,
        type: ENUM_NOTIFICATION_TYPE.OFFER_REJECTED,
        redirectLink: `${task._id}`,
    });
    sendSinglePushNotification(
        task!.customer.toString(),
        'Offer rejected by Provider',
        `Provider Rejected your offer, now your task is open for bid for other freelancers`,
        { taskId: task._id.toString() }
    );
    return task;
};

const acceptTaskByCustomerFromDB = async (profileID: string, bidID: string) => {
    const bidData: any = await bidModel.findById(bidID);
    if (!bidData) {
        throw new AppError(httpStatus.NOT_FOUND, 'Bid not found');
    }
    const taskData: any = await TaskModel.findById(bidData.task).populate({
        path: 'customer',
        select: 'email',
    });

    if (taskData?.customer?._id.toString() !== profileID.toString()) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized to accept this task'
        );
    }

    const finalAmount = bidData.price;

    const amount = finalAmount * 100;

    return {
        amount,
    };
};

const completeTaskByCustomer = async (
    taskId: string,
    currentUserId: string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const task = await TaskModel.findById(taskId).session(session);
        if (!task) {
            throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
        }

        if (task.customer?.toString() !== currentUserId) {
            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'You are not authorized to complete this task'
            );
        }

        const updatedTask = await TaskModel.findByIdAndUpdate(
            taskId,
            {
                status: ENUM_TASK_STATUS.COMPLETED,
            },
            {
                new: true,
                runValidators: true,
                session,
            }
        );

        // COMMIT TRANSACTION
        await session.commitTransaction();
        session.endSession();

        return updatedTask;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const TaskServices = {
    createTaskIntoDB,
    getAllTaskFromDB,
    getSingleTaskFromDB,
    deleteTaskFromDB,
    getMyTaskFromDB,
    acceptOfferByProvider,
    completeTaskByCustomer,
    acceptTaskByCustomerFromDB,
    updateTask,
    rejectOfferByProvider,
};
export default TaskServices;
