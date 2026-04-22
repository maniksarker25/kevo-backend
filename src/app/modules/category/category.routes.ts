import express, { NextFunction, Request, Response } from 'express';
// import { uploadFile } from '../../helper/multer-s3-uploader';
import { uploadFile } from '../../helper/multer-storage-cloudinary';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import categoryController from './category.controller';
import categoryValidation from './category.validation';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(categoryValidation.createCategoryValidationSchema),
    categoryController.createCategory
);

router.patch(
    '/update-category/:id',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(categoryValidation.updateCategoryValidationSchema),
    categoryController.updateCategory
);

router.get('/all-categories', categoryController.getAllCategories);
router.get('/get-single-category/:id', categoryController.getSingleCategory);
router.delete(
    '/delete-category/:id',
    auth(USER_ROLE.superAdmin),
    categoryController.deleteCategory
);

export const categoryRoutes = router;
