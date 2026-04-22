/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../error/appError';
import TaskModel from '../task/task.model';
import { IQuestion } from './question.interface';
import QuestionModel from './question.model';

const createQuestionIntoDB = async (
    userData: JwtPayload,
    payload: IQuestion
) => {
    const providerId = userData.profileId;
    const task: any = await TaskModel.findById(payload.task).populate({
        path: 'customer',
        select: 'name email phone user',
        populate: {
            path: 'user',
            select: '_id',
        },
    });
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }
    if (task.customer.user._id.toString() === userData.id) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You cannot ask question on your own task'
        );
    }
    const result = await QuestionModel.create({
        ...payload,
        provider: providerId,
    });
    return result;
};

const getMyQuestionsFromDB = async (providerId: string) => {
    const result = await QuestionModel.find({ provider: providerId });
    return result;
};
const getQuestionsByTaskIDFromDB = async (taskId: string) => {
    const result = await QuestionModel.find({ task: taskId }).populate({
        path: 'provider',
        select: 'name profile_image email',
    });
    return result;
};

const deleteQuestionFromDB = async (providerId: string, questionId: string) => {
    const question = await QuestionModel.findOne({
        _id: questionId,
        provider: providerId,
    });

    if (!question) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not allowed to delete this question or it does not exist'
        );
    }

    await QuestionModel.findByIdAndDelete(questionId);
    return { message: 'Question deleted successfully' };
};

const QuestionServices = {
    createQuestionIntoDB,
    getMyQuestionsFromDB,
    getQuestionsByTaskIDFromDB,
    deleteQuestionFromDB,
};
export default QuestionServices;
