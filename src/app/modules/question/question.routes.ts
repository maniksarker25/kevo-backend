import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import questionValidations from './question.validation';
import questionController from './question.controller';
import { uploadFile } from '../../helper/multer-s3-uploader';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.provider),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(questionValidations.createQuestionZodSchema),
    questionController.createQuestion
);
router.get(
    '/my-questions',
    auth(USER_ROLE.provider),
    questionController.getMyQuestions
);
router.get('/by-taskID/:taskId', questionController.getQuestionsByTaskId);
router.delete(
    '/delete/:id',
    auth(USER_ROLE.provider),
    questionController.deleteQuestion
);
export const questionRoutes = router;
