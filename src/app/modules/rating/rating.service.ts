import httpStatus from 'http-status';
import AppError from '../../error/appError';

import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import { IRating } from './rating.interface';
import Rating from './rating.model';

const createRatingIntoDB = async (
    currentUserID: string,
    payload: Partial<IRating>
) => {
    const task = await TaskModel.findOne({
        _id: payload.task,
        customer: currentUserID,
    });
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    if (task.status !== ENUM_TASK_STATUS.COMPLETED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can only rate after the task is completed'
        );
    }
    const existingRating = await Rating.findOne({
        task: payload.task,
        customer: currentUserID,
        provider: task.provider,
    });
    if (existingRating) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Rating already submitted for this task'
        );
    }

    const result = await Rating.create({
        ...payload,
        customer: currentUserID,
        provider: task.provider,
    });

    return result;
};
const getMyRatingsFromDB = async (currentUserID: string) => {
    const rating = await Rating.find({
        provider: currentUserID,
    }).populate({ path: 'customer', select: 'name profile_image' });

    return rating;
};

const getRatingsByTaskFromDB = async (taskId: string) => {
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    const rating = await Rating.find({
        task: task._id,
    });
    return rating;
};

const getProviderRatingsFromDB = async (providerId: string) => {
    const ratings = await Rating.find({
        provider: providerId,
    }).populate({ path: 'customer', select: 'name profile_image' });
    return ratings;
};
const RatingServices = {
    createRatingIntoDB,
    getMyRatingsFromDB,
    getRatingsByTaskFromDB,
    getProviderRatingsFromDB,
};
export default RatingServices;
