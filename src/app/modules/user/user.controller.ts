/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { USER_ROLE } from './user.constant';
import userServices from './user.services';

const registerUser = catchAsync(async (req, res) => {
    const result = await userServices.registerUser(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message:
            'User registration successful.Check email for verify your email',
        data: result,
    });
});
const verifyCode = catchAsync(async (req, res) => {
    const result = await userServices.verifyCode(
        req?.body?.email,
        req?.body?.verifyCode
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Successfully verified your account with email',
        data: result,
    });
});
const resendVerifyCode = catchAsync(async (req, res) => {
    const result = await userServices.resendVerifyCode(req?.body?.email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Verify code send to your email inbox',
        data: result,
    });
});

const getMyProfile = catchAsync(async (req, res) => {
    const result = await userServices.getMyProfile(req.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Successfully retrieved your data',
        data: result,
    });
});

const updateUserProfile = catchAsync(async (req, res) => {
    const file: any = req.files?.profile_image;
    if (req.files?.profile_image) {
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }
    const address_document_file: any = req.files?.address_document;
    if (req.files?.address_document) {
        req.body.address_document = getCloudFrontUrl(
            address_document_file[0].key
        );
    }

    const result = await userServices.updateUserProfile(req.user, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});
const changeUserStatus = catchAsync(async (req, res) => {
    const result = await userServices.changeUserStatus(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${
            result?.role == USER_ROLE.customer ? 'Tasker' : 'Freelancer'
        } is ${result?.isBlocked ? 'Blocked' : 'Unblocked'}`,
        data: result,
    });
});
const deleteUserAccount = catchAsync(async (req, res) => {
    const result = await userServices.deleteUserAccount(
        req.user,
        req.body.password
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Your account deleted successfully`,
        data: result,
    });
});
const adminVerifyUser = catchAsync(async (req, res) => {
    const result = await userServices.adminVerifyUserFromDB(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result?.isAdminVerified
            ? 'Mark as verified'
            : 'Mark as unverified',
        data: result,
    });
});
const upgradeAccount = catchAsync(async (req, res) => {
    const result = await userServices.upgradeAccount(req.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

const userController = {
    registerUser,
    verifyCode,
    resendVerifyCode,
    getMyProfile,
    changeUserStatus,
    deleteUserAccount,
    updateUserProfile,
    adminVerifyUser,
    upgradeAccount,
};
export default userController;
