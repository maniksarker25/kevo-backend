import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import subscriberController from './subscriber.controller';
import subscriberValidations from './subscriber.validation';

const router = express.Router();

router.post(
    '/create',
    validateRequest(subscriberValidations.createSubscriber),
    subscriberController.createSubscriber
);

export const subscriberRoutes = router;
