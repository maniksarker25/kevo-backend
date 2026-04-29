/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';

import TaskServices from './task.service';

const createTask = catchAsync(async (req, res) => {
    if (req.files?.task_attachments) {
        req.body.task_attachments = req.files.task_attachments.map(
            (file: any) => {
                return getCloudFrontUrl(file.key);
            }
        );
    }

    const result = await TaskServices.createTaskIntoDB(req.user, req?.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Task created successfully',
        data: result,
    });
});
const updateTask = catchAsync(async (req, res) => {
    if (req.files?.task_attachments) {
        req.body.task_attachments = req.files.task_attachments.map(
            (file: any) => {
                return getCloudFrontUrl(file.key);
            }
        );
    }

    const result = await TaskServices.updateTask(
        req.user.profileId,
        req.params.id,
        req?.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Task updated successfully',
        data: result,
    });
});

const getAllTask = catchAsync(async (req, res) => {
    const result = await TaskServices.getAllTaskFromDB(req?.user, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Task retrieved successfully',
        data: result,
    });
});
// get my task
const getMyTask = catchAsync(async (req, res) => {
    const result = await TaskServices.getMyTaskFromDB(req.user, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Task retrieved successfully',
        data: result,
    });
});
const getSingleTask = catchAsync(async (req, res) => {
    const id = req.params.id;

    const result = await TaskServices.getSingleTaskFromDB(
        req?.user?.profileId,
        id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Task retrieved successfully 1',
        data: result,
    });
});
const deleteTask = catchAsync(async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.profileId;
    await TaskServices.deleteTaskFromDB(id, currentUserId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Task deleted successfully',
        data: null,
    });
});

const acceptOffer = catchAsync(async (req, res) => {
    const { taskId } = req.body;
    const currentUserId = req.user.profileId;
    const result = await TaskServices.acceptOfferByProvider(
        taskId,
        currentUserId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Accept Offer successfully',
        data: result,
    });
});
const rejectOfferByProvider = catchAsync(async (req, res) => {
    const currentUserId = req.user.profileId;
    const result = await TaskServices.rejectOfferByProvider(
        req.params.id,
        currentUserId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Offer rejected successfully',
        data: result,
    });
});
const acceptTaskByCustomer = catchAsync(async (req, res) => {
    const { bidID } = req.body;
    const currentUserId = req.user.profileId;
    const result = await TaskServices.acceptTaskByCustomerFromDB(
        currentUserId,
        bidID
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment link generated successfully',
        data: result,
    });
});
const completeTask = catchAsync(async (req, res) => {
    const { taskId } = req.body;
    const currentUserId = req.user.profileId;
    const result = await TaskServices.completeTaskByCustomer(
        taskId,
        currentUserId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Complete Task Successfully',
        data: result,
    });
});
const startTask = catchAsync(async (req, res) => {
    const currentUserId = req.user.profileId;

    if (req.files?.beforeImages) {
        req.body.beforeImages = req.files.beforeImages.map((file: any) => {
            return getCloudFrontUrl(file.key);
        });
    }

    const result = await TaskServices.startTaskByProvider(
        req.params.id,
        currentUserId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Start Task Successfully',
        data: result,
    });
});

const TaskController = {
    createTask,
    getAllTask,
    getSingleTask,
    deleteTask,
    acceptOffer,
    getMyTask,
    completeTask,
    acceptTaskByCustomer,
    updateTask,
    rejectOfferByProvider,
    startTask,
};
export default TaskController;
