/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { ENUM_CANCELLATION_REQUEST_STATUS } from './cancellationRequest.enum';
import cancellationRequestServices from './cancellationRequest.service';

const createCancellationRequest = catchAsync(async (req, res) => {
    if (req.files?.reject_evidence) {
        req.body.cancellationEvidence = req.files.reject_evidence.map(
            (file: any) => {
                return getCloudFrontUrl(file.key);
            }
        );
    }
    const result =
        await cancellationRequestServices.createCancellationRequestIntoDb(
            req.user.profileId,
            req.body
        );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cancellation request created successfully',
        data: result,
    });
});

const getCancellationRequestByTask = catchAsync(async (req, res) => {
    const result =
        await cancellationRequestServices.getCancellationRequestByTaskFromDB(
            req.user.profileId,
            req.params.taskId as string
        );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cancellation request retrieved successfully',
        data: result,
    });
});

const cancelCancellationRequest = catchAsync(async (req, res) => {
    const result =
        await cancellationRequestServices.cancelCancellationRequestByTaskFromDB(
            req.user.profileId,
            req.params.id as string
        );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cancellation request deleted successfully',
        data: result,
    });
});

const handleAcceptRejectCancellationRequest = catchAsync(async (req, res) => {
    const { status } = req.body;

    if (req.files?.reject_evidence) {
        req.body.reject_evidence = req.files.reject_evidence.map(
            (file: any) => {
                return getCloudFrontUrl(file.key);
            }
        );
    }
    const result =
        await cancellationRequestServices.acceptRejectCancellationRequest(
            req.user.profileId,
            req.params.id as string,
            req.body
        );

    let message = 'Cancellation request updated successfully';

    if (status === ENUM_CANCELLATION_REQUEST_STATUS.ACCEPTED) {
        message = 'Cancellation request approved successfully';
    } else if (status === ENUM_CANCELLATION_REQUEST_STATUS.REJECTED) {
        message = 'Cancellation request rejected successfully';
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message,
        data: result,
    });
});

const makeDisputeForAdmin = catchAsync(async (req, res) => {
    const result = await cancellationRequestServices.makeDisputeForAdmin(
        req.user.profileId,
        req.params.id as string
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Dispute made successfully',
        data: result,
    });
});
const resolveByAdmin = catchAsync(async (req, res) => {
    const result = await cancellationRequestServices.resolveByAdmin(
        req.params.id as string,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Resolved by admin',
        data: result,
    });
});
const getAllCancelRequest = catchAsync(async (req, res) => {
    const result = await cancellationRequestServices.getAllCancelRequestFromDB(
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cancel requests retrieved successfully',
        data: result,
    });
});
const getSingleCancelRequest = catchAsync(async (req, res) => {
    const result = await cancellationRequestServices.getSingleCancelRequest(
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Single cancel requests retrieved successfully',
        data: result,
    });
});

const CancellationRequestController = {
    createCancellationRequest,
    getCancellationRequestByTask,
    cancelCancellationRequest,
    handleAcceptRejectCancellationRequest,
    makeDisputeForAdmin,
    resolveByAdmin,
    getAllCancelRequest,
    getSingleCancelRequest,
};
export default CancellationRequestController;
