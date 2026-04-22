import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';

import sendResponse from '../../utilities/sendResponse';
import feedbackServices from './feedback.service';

const createFeedback = catchAsync(async (req, res) => {
    const currentUserID = req.user.profileId;
    const result = await feedbackServices.createFeedbackIntoDB(
        currentUserID,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'FeedBack updated successfully',
        data: result,
    });
});
const getMyFeedBack = catchAsync(async (req, res) => {
    const currentUserID = req.user.profileId;
    const result = await feedbackServices.getMyFeedBackFromDB(currentUserID);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'feedBack retrieved successfully',
        data: result,
    });
});
const getFeedBackByTask = catchAsync(async (req, res) => {
    const taskID = req.body.taskId;
    const result = await feedbackServices.getFeedBackByTaskFromDB(taskID);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'feedBack retrieved by taskId successfully',
        data: result,
    });
});

const FeedbackController = { createFeedback, getMyFeedBack, getFeedBackByTask };
export default FeedbackController;
