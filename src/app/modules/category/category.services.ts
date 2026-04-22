/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { ICategory } from './category.interface';
import Category from './category.model';

// create category into db----------------
const createCategoryIntoDB = async (payload: ICategory) => {
    console.log('category payload:', payload);
    const result = await Category.create(payload);
    return result;
};

const updateCategoryIntoDB = async (
    id: string,
    payload: Partial<ICategory>
) => {
    const result = await Category.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    return result;
};

const getAllCategories = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';

    const searchMatchStage = searchTerm
        ? {
              $or: [{ name: { $regex: searchTerm, $options: 'i' } }],
          }
        : {};

    const pipeline: any[] = [
        {
            $match: { ...searchMatchStage, isDeleted: false },
        },
        {
            $lookup: {
                from: 'tasks',
                localField: '_id',
                foreignField: 'category',
                as: 'tasks',
            },
        },
        {
            $addFields: {
                totalTask: { $size: '$tasks' },
            },
        },
        {
            $lookup: {
                from: 'services',
                localField: '_id',
                foreignField: 'category',
                as: 'services',
            },
        },
        {
            $addFields: {
                totalServices: { $size: '$services' },
            },
        },
        {
            $project: {
                tasks: 0,
                services: 0,
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

    const aggResult = await Category.aggregate(pipeline);
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

const getSingleCategory = async (id: string) => {
    const category = await Category.findById(id);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }

    return category;
};
// delete category
const deleteCategoryFromDB = async (categoryId: string) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
    const result = await Category.findByIdAndDelete(categoryId);
    if (category.category_image) {
        deleteFileFromS3(category?.category_image);
    }

    return result;
};

const categoryService = {
    createCategoryIntoDB,
    updateCategoryIntoDB,
    getAllCategories,
    getSingleCategory,
    deleteCategoryFromDB,
};

export default categoryService;
