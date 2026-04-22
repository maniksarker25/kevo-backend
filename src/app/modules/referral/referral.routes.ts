import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import referralController from './referral.controller';
import validateRequest from '../../middlewares/validateRequest';
import ReferralValidations from './referral.validation';

const router = express.Router();

router.get(
    '/all-referral',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    referralController.getAllReferral
);

router.patch(
    '/update-value/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(ReferralValidations.updateReferralValueZodSchema),
    referralController.updateReferralValue
);

router.patch(
    '/update-status/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    referralController.updateReferralStatus
);

export const referralRoutes = router;
