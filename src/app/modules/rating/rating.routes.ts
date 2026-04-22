import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import feedbackValidations from './rating.validation';
import RatingController from './rating.controller';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.customer),
    validateRequest(feedbackValidations.createFeedbackZodSchema),
    RatingController.createRating
);
router.get(
    '/my-ratings',
    auth(USER_ROLE.provider),
    RatingController.getMyRatings
);
router.get(
    '/task-ratings',
    auth(USER_ROLE.provider, USER_ROLE.customer),
    RatingController.getRatingsByTask
);
export const ratingRoutes = router;
