import express from 'express';
import { uploadFile } from '../../helper/multer-s3-uploader';
import auth from '../../middlewares/auth';
import simpleAuth from '../../middlewares/simpleAuth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import TaskController from './task.controller';
import taskValidations from './task.validation';

const router = express.Router();

router.post(
    '/create-task',
    auth(USER_ROLE.customer),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(taskValidations.createTaskZodSchema),
    TaskController.createTask
);
router.patch(
    '/update-task/:id',
    auth(USER_ROLE.customer),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(taskValidations.updateTaskZodSchema),
    TaskController.updateTask
);
router.get('/all-task', simpleAuth, TaskController.getAllTask);
router.get(
    '/my-task',
    auth(USER_ROLE.customer, USER_ROLE.provider),
    TaskController.getMyTask
);
router.get(
    '/single-task/:id',
    // auth(
    //     USER_ROLE.customer,
    //     USER_ROLE.provider,
    //     USER_ROLE.admin,
    //     USER_ROLE.superAdmin
    // ),
    simpleAuth,
    TaskController.getSingleTask
);
router.delete(
    '/delete-task/:id',
    auth(USER_ROLE.provider, USER_ROLE.customer),
    TaskController.deleteTask
);
router.patch(
    '/acceptOffer',
    auth(USER_ROLE.provider),
    TaskController.acceptOffer
);
router.patch(
    '/reject-offer/:id',
    auth(USER_ROLE.provider),
    TaskController.rejectOfferByProvider
);
router.patch(
    '/accept-TaskBy-Customer',
    auth(USER_ROLE.customer),
    TaskController.acceptTaskByCustomer
);
router.patch(
    '/complete-task',
    auth(USER_ROLE.customer),
    TaskController.completeTask
);

export const taskRoutes = router;
