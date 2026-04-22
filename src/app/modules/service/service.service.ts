/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import CategoryModel from '../category/category.model';
import { IService } from './service.interface';
import {
    default as ServiceModel,
    default as serviceModel,
} from './service.model';

const createServiceIntoDB = async (userId: string, payload: IService) => {
    const category = await CategoryModel.findById(payload.category);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
    const result = await serviceModel.create({ ...payload, provider: userId });
    return result;
};
const getAllServiceFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';
    const isPopular = query.popular === 'true';

    const filters: any = {};

    Object.keys(query).forEach((key) => {
        if (
            ![
                'searchTerm',
                'page',
                'limit',
                'sortBy',
                'sortOrder',
                'popular',
            ].includes(key)
        ) {
            filters[key] = query[key];
        }
    });

    if (query.category) {
        filters.category = new mongoose.Types.ObjectId(
            query.category as string
        );
    }

    const searchMatchStage = searchTerm
        ? {
              $or: [
                  { title: { $regex: searchTerm, $options: 'i' } },
                  { description: { $regex: searchTerm, $options: 'i' } },
              ],
          }
        : {};

    const sortStage = isPopular ? { popularityScore: -1 } : { createdAt: -1 };

    const pipeline: any[] = [
        {
            $match: {
                ...filters,
                ...searchMatchStage,
            },
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        },
        {
            $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: true,
            },
        },
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
                            user: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            address: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: '$provider',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'feedbacks',
                localField: '_id',
                foreignField: 'service',
                as: 'feedbacks',
            },
        },
        {
            $addFields: {
                averageRating: {
                    $cond: {
                        if: { $gt: [{ $size: '$feedbacks' }, 0] },
                        then: { $avg: '$feedbacks.rating' },
                        else: 0,
                    },
                },
                totalRating: { $size: '$feedbacks' },
            },
        },
        {
            $addFields: {
                popularityScore: {
                    $add: [
                        { $multiply: ['$averageRating', 2] },
                        '$totalRating',
                    ],
                },
            },
        },
        {
            $project: {
                feedbacks: 0,
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

    const aggResult = await ServiceModel.aggregate(pipeline);

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

const getMyService = async (userId: string, query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';

    const filters: any = {};

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
        filters.category = new mongoose.Types.ObjectId(
            query.category as string
        );
    }

    const searchMatchStage = searchTerm
        ? {
              $or: [
                  { title: { $regex: searchTerm, $options: 'i' } },
                  { description: { $regex: searchTerm, $options: 'i' } },
              ],
          }
        : {};

    const pipeline: any[] = [
        {
            $match: {
                ...filters,
                ...searchMatchStage,
                provider: new mongoose.Types.ObjectId(userId),
            },
        },

        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        },
        {
            $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: true,
            },
        },

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
                            user: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            address: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: '$provider',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'feedbacks',
                localField: '_id',
                foreignField: 'service',
                as: 'feedbacks',
            },
        },

        {
            $addFields: {
                averageRating: {
                    $cond: {
                        if: { $gt: [{ $size: '$feedbacks' }, 0] },
                        then: { $avg: '$feedbacks.rating' },
                        else: 0,
                    },
                },
                totalRating: { $size: '$feedbacks' },
            },
        },
        {
            $project: {
                feedbacks: 0,
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await ServiceModel.aggregate(pipeline);
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

const deleteServiceFromDB = async (profileId: string, serviceId: string) => {
    const service = await serviceModel.findOne({
        _id: serviceId,
        provider: profileId,
    });

    if (!service) {
        throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
    }

    if (service.images && service.images.length > 0) {
        for (const imageUrl of service.images) {
            try {
                await deleteFileFromS3(imageUrl);
            } catch (error) {
                console.error(
                    `Failed to delete image from S3: ${imageUrl}`,
                    error
                );
            }
        }
    }

    await serviceModel.findByIdAndDelete(serviceId);

    return {
        message: 'Service and associated images deleted successfully',
        deletedServiceId: serviceId,
    };
};
const toggleServiceActiveStatusFromDB = async (
    profileId: string,
    serviceId: string
) => {
    const service = await serviceModel.findOne({
        _id: serviceId,
        provider: profileId,
    });

    if (!service) {
        throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
    }

    service.isActive = !service.isActive;
    await service.save();

    return service;
};
const getSingleServiceFromDB = async (serviceId: string) => {
    const service = await ServiceModel.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(serviceId) },
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        },

        {
            $addFields: {
                category: { $arrayElemAt: ['$category', 0] },
            },
        },
        {
            $lookup: {
                from: 'providers',
                localField: 'provider',
                foreignField: '_id',
                as: 'provider',
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            profile_image: 1,
                            email: 1,
                            address: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                provider: { $arrayElemAt: ['$provider', 0] },
            },
        },

        {
            $lookup: {
                from: 'feedbacks',
                localField: '_id',
                foreignField: 'service',
                as: 'feedbacks',
            },
        },

        {
            $addFields: {
                averageRating: {
                    $cond: {
                        if: { $gt: [{ $size: '$feedbacks' }, 0] },
                        then: { $avg: '$feedbacks.rating' },
                        else: 0,
                    },
                },
                totalRating: { $size: '$feedbacks' },
            },
        },
        {
            $project: {
                feedbacks: 0,
            },
        },
    ]);

    return service[0] || null;
};
const updateServiceFromDB = async (profileId: string, payload: any) => {
    const service = await serviceModel.findOne({ provider: profileId });
    if (!service) {
        throw new AppError(httpStatus.NOT_FOUND, 'Service Not Found');
    }

    if (payload.newImages && payload.newImages.length > 0) {
        payload.images = [...service.images, ...payload.newImages];
    } else {
        payload.images = [...service.images];
    }
    if (payload?.deletedImages) {
        payload.images = payload.images.filter(
            (url: any) => !payload?.deletedImages?.includes(url)
        );
    }
    const result = await ServiceModel.findOneAndUpdate(
        { provider: profileId },
        payload,
        { new: true, runValidators: true }
    );
    if (payload.deletedImages) {
        for (const image of payload.deletedImages) {
            deleteFileFromS3(image);
        }
    }
    return result;
};

const ServiceServices = {
    createServiceIntoDB,
    getAllServiceFromDB,
    deleteServiceFromDB,
    getSingleServiceFromDB,
    updateServiceFromDB,
    toggleServiceActiveStatusFromDB,
    getMyService,
};
export default ServiceServices;
