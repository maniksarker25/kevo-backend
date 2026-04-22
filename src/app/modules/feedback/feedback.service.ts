import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { IFeedback } from './feedback.interface';

import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import FeedbackModel from './feedback.model';

const createFeedbackIntoDB = async (
    currentUserID: string,
    payload: Partial<IFeedback>
) => {
    const task = await TaskModel.findOne({
        _id: payload.task,
        customer: currentUserID,
        status: ENUM_TASK_STATUS.COMPLETED,
    });
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    const existingFeedback = await FeedbackModel.findOne({
        task: payload.task,
        customer: currentUserID,
    });
    if (existingFeedback) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Feedback already submitted for this task'
        );
    }

    const result = await FeedbackModel.create({
        ...payload,
        customer: currentUserID,
        provider: task.provider,
        service: task.service,
    });

    return result;
};
const getMyFeedBackFromDB = async (currentUserID: string) => {
    const feedBack = await FeedbackModel.find({
        provider: currentUserID,
    }).populate({ path: 'customer', select: 'name profile_image' });

    return feedBack;
};

const getFeedBackByTaskFromDB = async (taskId: string) => {
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    const feedBack = await FeedbackModel.find({
        task: task._id,
    });
    return feedBack;
};
const FeedbackServices = {
    createFeedbackIntoDB,
    getMyFeedBackFromDB,
    getFeedBackByTaskFromDB,
};
export default FeedbackServices;
