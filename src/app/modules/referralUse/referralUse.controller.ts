import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import referralUseServices from './referralUse.service';

const verifyReferralCode = catchAsync(async (req, res) => {
    const result = await referralUseServices.verifyReferralCodeFromDB(
        req.body.code,
        req.user.profileId,
        req.user.role
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Verify Referral Code successful',
        data: result,
    });
});
const getMyReferral = catchAsync(async (req, res) => {
    const result = await referralUseServices.getMyReferralFromDB(
        req.user.profileId,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'My Referral get successfully',
        data: result,
    });
});

const getAllReferral = catchAsync(async (req, res) => {
    const result = await referralUseServices.getAllReferralUseFromDB(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'referral get successfully',
        data: result,
    });
});
const getReferralAndPlatformCharge = catchAsync(async (req, res) => {
    const result = await referralUseServices.getReferralAndPlatformCharge(
        req.user.profileId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Referral and Platform Charge fetched successfully',
        data: result,
    });
});

const ReferralUseController = {
    verifyReferralCode,
    getMyReferral,
    getAllReferral,
    getReferralAndPlatformCharge,
};
export default ReferralUseController;
