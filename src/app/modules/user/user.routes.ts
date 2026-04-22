import { NextFunction, Request, Response, Router } from 'express';
import { uploadFile } from '../../helper/multer-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import CustomerValidations from '../customer/customer.validation';
import { USER_ROLE } from './user.constant';
import userControllers from './user.controller';
import userValidations from './user.validation';

const router = Router();

router.post(
    '/sign-up',
    validateRequest(CustomerValidations.createCustomerSchema),
    userControllers.registerUser
);
//
router.post(
    '/verify-code',
    validateRequest(userValidations.verifyCodeValidationSchema),
    userControllers.verifyCode
);

router.post(
    '/resend-verify-code',
    validateRequest(userValidations.resendVerifyCodeSchema),
    userControllers.resendVerifyCode
);

router.get(
    '/get-my-profile',
    auth(
        USER_ROLE.customer,
        USER_ROLE.provider,
        USER_ROLE.admin,
        USER_ROLE.superAdmin
    ),
    userControllers.getMyProfile
);
router.patch(
    '/update-profile',
    auth(
        USER_ROLE.customer,
        USER_ROLE.provider,
        USER_ROLE.admin,
        USER_ROLE.superAdmin
    ),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    userControllers.updateUserProfile
);
//===
router.patch(
    '/block-unblock/:id',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    userControllers.changeUserStatus
);
router.post(
    '/delete-account',
    auth(USER_ROLE.customer),
    validateRequest(userValidations.deleteUserAccountValidationSchema),
    userControllers.deleteUserAccount
);
router.patch(
    '/verify-user/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    userControllers.adminVerifyUser
);

router.post(
    '/upgrade-account',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    userControllers.upgradeAccount
);

export const userRoutes = router;
