import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import sendResponse from '../../utilities/sendResponse';
import paymentServices from './payment.service';

const getAllPayments = catchAsync(async (req, res) => {
    const result = await paymentServices.getAllPayments(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payments retrieved successfully',
        data: result,
    });
});
const makePaidUnPaid = catchAsync(async (req, res) => {
    const result = await paymentServices.makePaidUnPaid(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message:
            result?.status == ENUM_PAYMENT_STATUS.PAID
                ? 'Payment mark as paid'
                : 'Payment mark as unpaid',
        data: result,
    });
});
const getProviderEarnings = catchAsync(async (req, res) => {
    const result = await paymentServices.getProviderEarnings(
        req.user.profileId,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Provider earnings retrieved successfully',
        data: result,
    });
});

const PaymentController = {
    getAllPayments,
    makePaidUnPaid,
    getProviderEarnings,
};
export default PaymentController;
