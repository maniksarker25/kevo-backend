import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';

import sendResponse from '../../utilities/sendResponse';
import RatingServices from './rating.service';

const createRating = catchAsync(async (req, res) => {
    const currentUserID = req.user.profileId;
    const result = await RatingServices.createRatingIntoDB(
        currentUserID,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Rating updated successfully',
        data: result,
    });
});
const getMyRatings = catchAsync(async (req, res) => {
    const currentUserID = req.user.profileId;
    const result = await RatingServices.getMyRatingsFromDB(currentUserID);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Ratings retrieved successfully',
        data: result,
    });
});
const getRatingsByTask = catchAsync(async (req, res) => {
    const taskID = req.body.taskId;
    const result = await RatingServices.getRatingsByTaskFromDB(taskID);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Ratings retrieved by taskId successfully',
        data: result,
    });
});

const RatingController = { createRating, getMyRatings, getRatingsByTask };
export default RatingController;
