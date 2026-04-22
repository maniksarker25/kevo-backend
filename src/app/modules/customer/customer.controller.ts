/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import CustomerServices from './customer.services';

const updateUserProfile = catchAsync(async (req, res) => {
    const file: any = req.files?.profile_image;
    if (req.files?.profile_image) {
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }

    const result = await CustomerServices.updateUserProfile(req.user, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});
const getAllCustomer = catchAsync(async (req, res) => {
    const result = await CustomerServices.getAllCustomerFromDB(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Customers get successfully',
        data: result,
    });
});
const getSingleCustomer = catchAsync(async (req, res) => {
    const result = await CustomerServices.getSingleCustomer(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Single customer retrieved successfully',
        data: result,
    });
});

const CustomerController = {
    updateUserProfile,
    getAllCustomer,
    getSingleCustomer,
};

export default CustomerController;
