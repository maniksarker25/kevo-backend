import express, { NextFunction, Request, Response } from 'express';
import { uploadFile } from '../../helper/multer-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import CustomerController from './customer.controller';
import CustomerValidations from './customer.validation';

const router = express.Router();

router.patch(
    '/update-profile',
    auth(USER_ROLE.customer, USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(CustomerValidations.updateCustomerData),
    CustomerController.updateUserProfile
);
router.get(
    '/get-all',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    CustomerController.getAllCustomer
);
router.get(
    '/get-single/:id',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    CustomerController.getSingleCustomer
);
router.get(
    '/home-data',
    auth(USER_ROLE.customer),
    CustomerController.getHomeData
);
export const CustomerRoutes = router;
