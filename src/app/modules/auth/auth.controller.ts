import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import authServices from './auth.services';

const loginUser = catchAsync(async (req, res) => {
    const result = await authServices.loginUserIntoDB(req.body);
    const { refreshToken } = result;

    // Set secure cookies
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User login successfully',
        data: result,
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { ...passwordData } = req.body;
    const result = await authServices.changePasswordIntoDB(
        req.user,
        passwordData
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password is updated successfully',
        data: result,
    });
});

const refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    const result = await authServices.refreshToken(refreshToken);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token is retrieved successfully',
        data: result,
    });
});
const forgetPassword = catchAsync(async (req, res) => {
    const phone = req.body.phone;
    const result = await authServices.forgetPassword(phone);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset code send to the phone number',
        data: result,
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const result = await authServices.resetPassword(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset successfully',
        data: result,
    });
});
const verifyResetOtp = catchAsync(async (req, res) => {
    const result = await authServices.verifyResetOtp(
        req.body.phone,
        req.body.resetCode
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reset code verified',
        data: result,
    });
});

const resendResetCode = catchAsync(async (req, res) => {
    const result = await authServices.resendResetCode(req?.body.phone);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reset code resend successfully',
        data: result,
    });
});

const getAllUser = catchAsync(async (req, res) => {
    const result = await authServices.getAllUserFromDB();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All User Get Successfully',
        data: result,
    });
});

const authControllers = {
    loginUser,
    changePassword,
    refreshToken,
    forgetPassword,
    resetPassword,
    verifyResetOtp,
    resendResetCode,
    getAllUser,
};

export default authControllers;
