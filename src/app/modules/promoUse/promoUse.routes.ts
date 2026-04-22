import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import promoUseController from './promoUse.controller';

const router = express.Router();

router.get(
    '/all-promo-use',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    promoUseController.getAllPromoUses
);

export const promoUseRoutes = router;
