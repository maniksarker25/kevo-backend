import express from 'express';
import { uploadFile } from '../../helper/multer-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import CancellationRequestValidations from '../cancellationRequest/cancellationRequest.validation';
import { USER_ROLE } from '../user/user.constant';
import extensionRequestController from './extensionRequest.controller';
import extensionRequestValidations from './extensionRequest.validation';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    validateRequest(
        extensionRequestValidations.createExtensionRequestZodSchema
    ),
    extensionRequestController.createExtensionRequest
);
router.get(
    '/byTask/:taskId',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    extensionRequestController.extensionRequestByTask
);
router.delete(
    '/delete/:id',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    extensionRequestController.cancelExtensionRequestByTask
);
router.patch(
    '/accept-reject/:id',
    auth(USER_ROLE.customer, USER_ROLE.provider),

    uploadFile(),

    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },

    validateRequest(
        extensionRequestValidations.extensionRequestActionZodSchema
    ),

    extensionRequestController.extensionRequestAcceptReject
);

router.post(
    '/make-dispute-for-admin/:id',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    extensionRequestController.makeDisputeForAdmin
);
router.patch(
    '/resolve-by-admin/:id',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    validateRequest(CancellationRequestValidations.resolveByAdminZodSchema),

    extensionRequestController.resolveByAdmin
);
router.get(
    '/get-all',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    extensionRequestController.getAllExtensionRequest
);
router.get(
    '/get-single/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    extensionRequestController.getSingleExtensionRequest
);

router.patch(
    '/cancel-task-by-admin/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    extensionRequestController.cancelTaskByAdmin
);

export const extensionRequestRoutes = router;
