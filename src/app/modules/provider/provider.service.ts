/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../error/appError';
import BidModel from '../bid/bid.model';
import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import { IProvider } from './provider.interface';
import { Provider } from './provider.model';

const updateProviderFromDB = async (
    id: string,
    payload: Partial<IProvider>
) => {
    const result = await Provider.findByIdAndUpdate(
        id,
        { $set: payload },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Provider not found');
    }

    return result;
};

const getAllProviderFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';
    const isBlocked =
        query.isBlocked !== undefined
            ? JSON.parse(query.isBlocked as string)
            : undefined;
    const filters: any = {};
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
                  { phone: { $regex: searchTerm, $options: 'i' } },
              ],
          }
        : {};

    const provider = await Provider.aggregate([
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
                pipeline: [{ $project: { isBlocked: 1, isAdminVerified: 1 } }],
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
                foreignField: 'provider',
                as: 'activeTasks',
                pipeline: [
                    {
                        $match: {
                            status: {
                                $in: [
                                    ENUM_TASK_STATUS.IN_PROGRESS,
                                    ENUM_TASK_STATUS.OPEN,
                                ],
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                totalTaskCount: { $size: '$activeTasks' },
            },
        },
        {
            $project: { activeTasks: 0 },
        },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ]);

    const result = provider[0]?.result || [];
    const total = provider[0]?.totalCount[0]?.total || 0;
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

const getSingleProvider = async (id: string) => {
    const result = await Provider.findById(id).populate({
        path: 'user',
        select: 'isBlocked isAdminVerified',
    });
    return result;
};

const getProviderMetaDataFromDB = async (profileId: string) => {
    // -------- 1) TASK META COUNT --------
    const result = await TaskModel.aggregate([
        {
            $match: {
                provider: new Types.ObjectId(profileId),
            },
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const meta = {
        completedCount: 0,
        inProgressCount: 0,
        pendingCount: 0,
    };

    result.forEach((item) => {
        if (item._id === ENUM_TASK_STATUS.COMPLETED)
            meta.completedCount = item.count;

        if (item._id === ENUM_TASK_STATUS.IN_PROGRESS)
            meta.inProgressCount = item.count;

        if (item._id === ENUM_TASK_STATUS.OPEN) meta.pendingCount = item.count;
    });

    const bids = await BidModel.aggregate([
        {
            $match: {
                provider: new mongoose.Types.ObjectId(profileId),
            },
        },
        {
            $lookup: {
                from: 'tasks',
                localField: 'task',
                foreignField: '_id',
                as: 'task',
            },
        },
        { $unwind: '$task' },
        {
            $match: {
                'task.status': ENUM_TASK_STATUS.OPEN,
            },
        },
        { $count: 'count' },
    ]);

    const bidOpenForBidCount = bids[0]?.count || 0;
    return {
        ...meta,
        bidOpenForBidCount,
    };
};

const completeIdentityVerificationFromDB = async (
    profileId: string,
    payload: any
) => {
    const provider = await Provider.findById(profileId);
    if (!provider) {
        throw new AppError(httpStatus.NOT_FOUND, 'Provider not found');
    }

    if (payload.identificationDocumentType !== 'BVN') {
        const updatedProvider = await Provider.findByIdAndUpdate(
            profileId,
            {
                isIdentificationDocumentApproved: true,
                identificationDocumentType: payload.identificationDocumentType,
                identificationDocumentNumber: payload.id_number,
                identificationDocument: payload.identification_document,
            },
            { new: true }
        );
        return updatedProvider;
    } else {
        const updatedProvider = await Provider.findByIdAndUpdate(
            profileId,
            {
                isBankVerificationNumberApproved: true,
                bankVerificationNumber: payload.id_number,
                bankAccountNumber: payload.id_number,
            },
            { new: true }
        );
        return updatedProvider;
    }

    //TODO: need to open when smile id have balance
    // const data = buildVerificationPayload(
    //     profileId,
    //     payload.identificationDocumentType,
    //     payload
    // );

    // try {
    //     const response = await axios.post(
    //         `${process.env.SMILE_BASE_URL}/v2/verify`,
    //         data,
    //         {
    //             headers: { 'Content-Type': 'application/json' },
    //         }
    //     );

    //     const result = response.data;

    //     if (result.Actions?.Verify_ID_Number !== 'Verified') {
    //         throw new AppError(
    //             httpStatus.BAD_REQUEST,
    //             `Invalid ${payload.identificationDocumentType} format`
    //         );
    //     } else if (result.ResultCode === '1022') {
    //         throw new AppError(
    //             httpStatus.BAD_REQUEST,
    //             `${payload.identificationDocumentType} is valid but personal details do not match`
    //         );
    //     } else if (
    //         result.ResultCode === '1000' ||
    //         result.ResultCode === '1020' ||
    //         result.ResultCode === '1021'
    //     ) {
    //         if (payload.identificationDocumentType !== 'BVN') {
    //             const updatedProvider = await Provider.findByIdAndUpdate(
    //                 profileId,
    //                 {
    //                     isIdentificationDocumentApproved: true,
    //                     identificationDocumentType:
    //                         payload.identificationDocumentType,
    //                     identificationDocumentNumber: payload.id_number,
    //                     identification_document:
    //                         payload.identification_document,
    //                 },
    //                 { new: true }
    //             );
    //             return updatedProvider;
    //         } else {
    //             const updatedProvider = await Provider.findByIdAndUpdate(
    //                 profileId,
    //                 {
    //                     isBankVerificationNumberApproved: true,
    //                     bankVerificationNumber: payload.id_number,
    //                     bankAccountNumber: payload.id_number,
    //                 },
    //                 { new: true }
    //             );
    //             return updatedProvider;
    //         }
    //     } else {
    //         throw new AppError(httpStatus.BAD_REQUEST, 'Verification failed');
    //     }
    // } catch (error: any) {
    //     // Axios error logging
    //     if (error.response) {
    //         // Server responded with a status outside 2xx
    //         console.error('Axios response error:', error.response.data);
    //         console.error('Status:', error.response.status);
    //     } else if (error.request) {
    //         // Request was made but no response received
    //         console.error('Axios request error:', error.request);
    //     } else {
    //         // Something else happened
    //         console.error('Error message:', error.message);
    //         throw new AppError(
    //             httpStatus.INTERNAL_SERVER_ERROR,
    //             error.message
    //                 ? error.message
    //                 : 'Failed to verify identification'
    //         );
    //     }
    //     throw new AppError(
    //         httpStatus.INTERNAL_SERVER_ERROR,
    //         'Failed to verify identification'
    //     );
    // }
};

const verifyBVN = async (profileId: string, bvn: string) => {
    const provider = await Provider.findById(profileId);
    if (!provider) {
        throw new AppError(httpStatus.NOT_FOUND, 'Provider not found');
    }
    const result = await Provider.findByIdAndUpdate(
        profileId,
        { isBankVerificationNumberApproved: true, bankVerificationNumber: bvn },
        { new: true }
    );
    return result;
};

const homeData = async (providerId: string, query: Record<string, unknown>) => {
    const lat = Number(query.lat);
    const lng = Number(query.lng);
    const maxDistance = Number(query.maxDistance) || 10;

    const nearbyTasks = await TaskModel.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                distanceField: 'distance',
                spherical: true,
                maxDistance: maxDistance * 1000,
                query: {
                    status: ENUM_TASK_STATUS.OPEN,
                },
            },
        },
        {
            $sort: {
                distance: 1,
            },
        },
        {
            $addFields: {
                distanceKm: {
                    $round: [{ $divide: ['$distance', 1000] }, 2],
                },
            },
        },
        {
            $project: {
                title: 1,
                serviceType: 1,
                budget: 1,
                taskStartDateTime: 1,
                status: 1,
                distanceKm: 1,
            },
        },
        {
            $limit: 10,
        },
    ]);

    const activeTask = await TaskModel.find({
        provider: providerId,
        status: {
            $in: [
                ENUM_TASK_STATUS.IN_PROGRESS,
                ENUM_TASK_STATUS.IN_PROGRESS,
                ENUM_TASK_STATUS.OPEN,
            ],
        },
    }).select('title serviceType budget taskStartDateTime status');
    return {
        nearbyTasks,
        activeTask,
    };
};

const getTodaysActivity = async (providerId: string) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await TaskModel.aggregate([
        {
            $match: {
                provider: providerId,
            },
        },
        {
            $facet: {
                activeTask: [
                    {
                        $match: {
                            status: ENUM_TASK_STATUS.IN_PROGRESS,
                        },
                    },
                    { $count: 'count' },
                ],
                completedTask: [
                    {
                        $match: {
                            status: ENUM_TASK_STATUS.COMPLETED,
                            markCompletedByProviderAt: {
                                $gte: startOfDay,
                                $lte: endOfDay,
                            },
                        },
                    },
                    { $count: 'count' },
                ],
                assignedTask: [
                    {
                        $match: {
                            status: ENUM_TASK_STATUS.ASSIGNED,
                            taskStartDateTime: {
                                $gte: startOfDay,
                                $lte: endOfDay,
                            },
                        },
                    },
                    { $count: 'count' },
                ],
                cancelledTask: [
                    {
                        $match: {
                            status: ENUM_TASK_STATUS.CANCELLED,
                            cancelledAt: {
                                $gte: startOfDay,
                                $lte: endOfDay,
                            },
                        },
                    },
                    { $count: 'count' },
                ],
            },
        },
    ]);

    const data = result[0];

    return {
        activeTask: data.activeTask[0]?.count || 0,
        completedTask: data.completedTask[0]?.count || 0,
        assignedTask: data.assignedTask[0]?.count || 0,
        cancelledTask: data.cancelledTask[0]?.count || 0,
    };
};

const getProviderMonthlyTasks = async (
    providerId: string,
    month: number,
    year: number
) => {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const tasks = await TaskModel.find({
        provider: providerId,
        isDeleted: false,
        taskStartDateTime: {
            $gte: startDate,
            $lte: endDate,
        },
    })
        .populate('customer')
        .sort({ taskStartDateTime: -1 });

    return tasks;
};

const ProviderServices = {
    updateProviderFromDB,
    getAllProviderFromDB,
    getSingleProvider,
    getProviderMetaDataFromDB,
    completeIdentityVerificationFromDB,
    verifyBVN,
    homeData,
    getTodaysActivity,
    getProviderMonthlyTasks,
};
export default ProviderServices;
