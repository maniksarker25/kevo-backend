import express from 'express';

import { NextFunction, Request, Response } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import ProviderController from './provider.controller';

import { uploadFile } from '../../helper/multer-s3-uploader';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import ProviderValidations from './provider.validation';

const router = express.Router();

router.patch(
    '/update-provider',
    validateRequest(ProviderValidations.updateProviderZodSchema),
    ProviderController.updateProvider
);
router.get(
    '/all-provider',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    ProviderController.getAllProvider
);
router.get(
    '/get-single/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    ProviderController.getSingleProvider
);
router.get(
    '/metaData',
    auth(USER_ROLE.provider),
    ProviderController.getProviderMetaData
);

router.post(
    '/complete-identity-verification',
    auth(USER_ROLE.provider),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    // validateRequest(ProviderValidations.completeIdentityVerificationZodSchema),
    ProviderController.completeIdentityVerification
);
router.post(
    '/verify-bvn',
    auth(USER_ROLE.provider),
    validateRequest(ProviderValidations.verifyBVNZodSchema),
    ProviderController.verifyBVN
);
export const providerRoutes = router;
