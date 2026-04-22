import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import transactionController from './transaction.controller';

const router = express.Router();

router.get(
    '/my-transaction',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    transactionController.getMyTransaction
);
router.get(
    '/all-transaction',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    transactionController.getAllTransaction
);

export const transactionRoutes = router;
