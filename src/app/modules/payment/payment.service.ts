import httpStatus from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../error/appError';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import Payment from './payment.model';

/* eslint-disable @typescript-eslint/no-explicit-any */
const getAllPayments = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';
    const filters: Record<string, any> = {};

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
            ].includes(key)
        ) {
            filters[key] = query[key];
        }
    });

    // Sorting
    const sortBy: any = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortStage = { [sortBy]: sortOrder };

    const searchMatchStage = searchTerm
        ? {
              $or: [{ _id: { $regex: searchTerm, $options: 'i' } }],
          }
        : {};
    const pipeline: any[] = [
        { $match: { ...filters, ...searchMatchStage } },
        {
            $lookup: {
                from: 'tasks',
                localField: 'task',
                foreignField: '_id',
                as: 'task',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: '$task', preserveNullAndEmptyArrays: true } },

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
                            bankName: 1,
                            bankAccountNumber: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
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
        { $sort: sortStage },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await Payment.aggregate(pipeline);
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

const makePaidUnPaid = async (id: string) => {
    const payment = await Payment.findById(id);
    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    const status =
        payment.status == ENUM_PAYMENT_STATUS.PAID
            ? ENUM_PAYMENT_STATUS.UNPAID
            : ENUM_PAYMENT_STATUS.PAID;
    const result = await Payment.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );
    return result;
};
// interface IEarningQuery {
//     page?: string;
//     limit?: string;
//     type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
//     date?: string;
//     year?: string;
//     month?: string;
//     week?: string;
// }
const buildDateRange = (query: any) => {
    const { type, date, year, month, week } = query;

    let start: Date | undefined;
    let end: Date | undefined;

    if (type === 'daily' && date) {
        start = new Date(date);
        start.setHours(0, 0, 0, 0);

        end = new Date(date);
        end.setHours(23, 59, 59, 999);
    }

    if (type === 'weekly' && year && week) {
        const firstDayOfYear = new Date(Number(year), 0, 1);
        const weekStart = new Date(firstDayOfYear);

        weekStart.setDate(firstDayOfYear.getDate() + (Number(week) - 1) * 7);
        weekStart.setHours(0, 0, 0, 0);

        start = weekStart;

        end = new Date(weekStart);
        end.setDate(weekStart.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    }

    if (type === 'monthly' && year && month) {
        start = new Date(Number(year), Number(month) - 1, 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(Number(year), Number(month), 0);
        end.setHours(23, 59, 59, 999);
    }

    if (type === 'yearly' && year) {
        start = new Date(Number(year), 0, 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(Number(year), 11, 31);
        end.setHours(23, 59, 59, 999);
    }

    if (type === 'lifetime') {
        return {};
    }

    return { start, end };
};

/**
 * Get provider earnings with filters & pagination
 */
const getProviderEarnings = async (providerId: string, query: any) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const { start, end } = buildDateRange(query) as any;

    const matchStage: any = {
        provider: new Types.ObjectId(providerId),
        status: ENUM_PAYMENT_STATUS.PAID,
    };

    // Filter by updatedAt (NOT createdAt)
    if (start && end) {
        matchStage.updatedAt = {
            $gte: start,
            $lte: end,
        };
    }

    const pipeline: any = [
        { $match: matchStage },

        {
            $facet: {
                data: [
                    { $sort: { updatedAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },

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
                        $project: {
                            _id: 1,
                            amount: 1,
                            updatedAt: 1,
                            taskTitle: '$task.title',
                        },
                    },
                ],

                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const result = await Payment.aggregate(pipeline);

    const total = result[0]?.totalCount[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        data: result[0]?.data || [],
    };
};

const PaymentServices = { getAllPayments, makePaidUnPaid, getProviderEarnings };
export default PaymentServices;
