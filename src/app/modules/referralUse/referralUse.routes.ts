import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import referralUseController from './referralUse.controller';
import referralUseValidations from './referralUse.validation';

const router = express.Router();

router.post(
    '/apply-referral-code',
    validateRequest(referralUseValidations.verifyReferralCodeZodSchema),
    auth(USER_ROLE.customer, USER_ROLE.provider),
    referralUseController.verifyReferralCode
);

router.get(
    '/my-referral',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    referralUseController.getMyReferral
);
router.get(
    '/all-referral',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    referralUseController.getAllReferral
);

router.get(
    '/referral-and-platform-charge',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    referralUseController.getReferralAndPlatformCharge
);

export const referralUseRoutes = router;
