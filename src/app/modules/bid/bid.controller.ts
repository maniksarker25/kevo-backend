import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import BidServices from './bid.service';

const createBid = catchAsync(async (req, res) => {
    const result = await BidServices.createBidIntoDB(req.user, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Bid created successfully',
        data: result,
    });
});

const getBidsByTask = catchAsync(async (req, res) => {
    const result = await BidServices.getBidsByTaskIDFromDB(
        req.params.id,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Bids fetched by taskID successfully',
        data: result,
    });
});

const deleteBid = catchAsync(async (req, res) => {
    const result = await BidServices.deleteBidFromDB(
        req.params.id,
        req.user.profileId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Bid deleted successfully',
        data: result,
    });
});
const updateBid = catchAsync(async (req, res) => {
    const result = await BidServices.updateBidIntoDB(
        req.params.id,
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Bid Update successfully',
        data: result,
    });
});

const BidController = {
    createBid,
    deleteBid,
    getBidsByTask,
    updateBid,
};
export default BidController;
