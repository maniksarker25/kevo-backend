import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import subscriberServices from './subscriber.service';

const createSubscriber = catchAsync(async (req, res) => {
    const result = await subscriberServices.createSubscriber(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Thanks for subscribe!',
        data: result,
    });
});

const SubscriberController = { createSubscriber };
export default SubscriberController;
