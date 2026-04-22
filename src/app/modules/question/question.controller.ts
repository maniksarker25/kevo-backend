import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';

import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import QuestionServices from './question.service';

const createQuestion = catchAsync(async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file: any = req.files?.question_image;

    if (req.files?.question_image) {
        req.body.question_image = getCloudFrontUrl(file[0].key);
    }

    const result = await QuestionServices.createQuestionIntoDB(
        req.user,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Question created successfully',
        data: result,
    });
});
const getMyQuestions = catchAsync(async (req, res) => {
    const result = await QuestionServices.getMyQuestionsFromDB(
        req.user.profileId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'My questions fetched successfully',
        data: result,
    });
});

const getQuestionsByTaskId = catchAsync(async (req, res) => {
    const result = await QuestionServices.getQuestionsByTaskIDFromDB(
        req.params.taskId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Questions fetched by Task ID successfully',
        data: result,
    });
});
const deleteQuestion = catchAsync(async (req, res) => {
    const result = await QuestionServices.deleteQuestionFromDB(
        req.user.profileId,
        req.params.id
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Question deleted successfully',
        data: result,
    });
});

const QuestionController = {
    createQuestion,
    getMyQuestions,
    getQuestionsByTaskId,
    deleteQuestion,
};
export default QuestionController;
