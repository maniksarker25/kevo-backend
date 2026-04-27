import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';

import BidController from './bid.controller';
import BidValidations from './bid.validation';

const router = express.Router();

router.post(
    '/create-bid',
    auth(USER_ROLE.provider),
    validateRequest(BidValidations.createBidZodSchema),
    BidController.createBid
);

router.get('/task-bids/:id', BidController.getBidsByTask);
router.delete(
    '/delete-bid/:id',
    auth(USER_ROLE.provider),
    BidController.deleteBid
);
router.patch(
    '/update-bid/:id',
    auth(USER_ROLE.provider, USER_ROLE.customer),
    validateRequest(BidValidations.updateBidZodSchema),
    BidController.updateBid
);

router.patch('/accept-bid', auth(USER_ROLE.customer), BidController.acceptBid);
router.patch('/reject-bid', auth(USER_ROLE.customer), BidController.rejectBid);

export const bidRoutes = router;
