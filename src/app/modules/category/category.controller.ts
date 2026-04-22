/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import categoryService from './category.services';

const createCategory = catchAsync(async (req, res) => {
    const file: any = req.files?.category_image;
    // if (req.files?.category_image) {
    //     req.body.category_image = getCloudFrontUrl(file[0].key);
    // }
      if (file) {
    req.body.category_image = file[0].path; // Cloudinary returns URL as path
  }
    const result = await categoryService.createCategoryIntoDB(req?.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category created successfully',
        data: result,
    });
});

const getAllCategories = catchAsync(async (req, res) => {
    const result = await categoryService.getAllCategories(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category retrieved successfully',
        data: result,
    });
});
const getSingleCategory = catchAsync(async (req, res) => {
    const result = await categoryService.getSingleCategory(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category retrieved successfully',
        data: result,
    });
});

const updateCategory = catchAsync(async (req, res) => {
    const file: any = req.files?.category_image;
    // if (req.files?.category_image) {
    //     req.body.category_image = getCloudFrontUrl(file[0].key);
    // }

      if (file) {
    req.body.category_image = file[0].path; // Cloudinary returns URL as path
  }
    const result = await categoryService.updateCategoryIntoDB(
        req?.params?.id,
        req?.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category updated successfully',
        data: result,
    });
});

// delete category
const deleteCategory = catchAsync(async (req, res) => {
    const result = await categoryService.deleteCategoryFromDB(req?.params?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category deleted successfully',
        data: result,
    });
});

const categoryController = {
    createCategory,
    updateCategory,
    getSingleCategory,
    deleteCategory,
    getAllCategories,
};
export default categoryController;
