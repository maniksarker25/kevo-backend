import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import paymentController from './payment.controller';

const router = express.Router();

router.get(
    '/get-all',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    paymentController.getAllPayments
);

router.patch(
    '/make-paid-unpaid/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    paymentController.makePaidUnPaid
);

router.get(
    '/provider-earnings',
    auth(USER_ROLE.provider),
    paymentController.getProviderEarnings
);

export const paymentRoutes = router;
