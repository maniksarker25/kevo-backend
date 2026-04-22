/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import oAuthController from './oAuth.controller';
import oAuthValidations from './oAuth.validations';

const router = express.Router();

router.post(
    '/login',
    validateRequest(oAuthValidations.oAuthLoginValidationSchema),
    oAuthController.oAuthLogin
);
router.post(
    '/link-social',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    oAuthController.oAuthLink
);
export const oauthRoutes = router;
