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
    const result = await RatingServices.getRatingsByTaskFromDB(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Ratings retrieved by taskId successfully',
        data: result,
    });
});
const getProviderRatings = catchAsync(async (req, res) => {
    const result = await RatingServices.getProviderRatingsFromDB(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Ratings retrieved by providerId successfully',
        data: result,
    });
});

const RatingController = {
    createRating,
    getMyRatings,
    getRatingsByTask,
    getProviderRatings,
};
export default RatingController;
