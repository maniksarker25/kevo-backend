import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import RatingController from './rating.controller';
import feedbackValidations from './rating.validation';

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
    '/task-ratings/:id',
    auth(USER_ROLE.provider, USER_ROLE.customer),
    RatingController.getRatingsByTask
);
router.get('/provider-ratings/:id', RatingController.getProviderRatings);
export const ratingRoutes = router;
