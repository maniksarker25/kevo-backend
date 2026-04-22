import express from 'express';
import { paystackPaymentController } from './paystackPayment.controller';
const router = express.Router();
router.post(
    '/webhook',
    express.raw({ type: '*/*' }),
    paystackPaymentController.payStackHandleWebhook
);

export const paystackPaymentRoutes = router;
