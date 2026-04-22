import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import PaystackPaymentService from './paystackPayment.service';

const payStackHandleWebhook = catchAsync(async (req, res) => {
    const result = await PaystackPaymentService.handlePaystackWebhook(req);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Paystack webhook payment successfully',
        data: result,
    });
});

export const paystackPaymentController = {
    payStackHandleWebhook,
};
