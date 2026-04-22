import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import feedbackValidations from './feedback.validation';
import feedbackController from './feedback.controller';

const router = express.Router();

router.post(
    '/create-feedback',
    auth(USER_ROLE.customer),
    validateRequest(feedbackValidations.createFeedbackZodSchema),
    feedbackController.createFeedback
);
router.get(
    '/my-feedback',
    auth(USER_ROLE.provider),
    feedbackController.getMyFeedBack
);
router.get(
    '/task-feedback',
    auth(USER_ROLE.provider, USER_ROLE.customer),
    feedbackController.getFeedBackByTask
);
export const feedbackRoutes = router;
