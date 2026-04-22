import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import referralServices from './referral.service';

const getAllReferral = catchAsync(async (req, res) => {
    const result = await referralServices.getAllReferralFromDB();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'referral get successfully',
        data: result,
    });
});
const updateReferralValue = catchAsync(async (req, res) => {
    const result = await referralServices.updateReferralValueFromDB(
        req.params.id,
        req.body.value
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'referral value update successfully',
        data: result,
    });
});
const updateReferralStatus = catchAsync(async (req, res) => {
    const result = await referralServices.updateReferralStatusFromDB(
        req.params.id
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Referral status updated successfully',
        data: result,
    });
});

const ReferralController = {
    getAllReferral,
    updateReferralValue,
    updateReferralStatus,
};
export default ReferralController;
