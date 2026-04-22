import { Router } from 'express';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { bidRoutes } from '../modules/bid/bid.routes';
import { cancellationRequestRoutes } from '../modules/cancellationRequest/cancellationRequest.routes';
import { categoryRoutes } from '../modules/category/category.routes';
import { conversationRoutes } from '../modules/conversation/conversation.routes';
import { CustomerRoutes } from '../modules/customer/customer.routes';
import { extensionRequestRoutes } from '../modules/extensionRequest/extensionRequest.routes';
import { feedbackRoutes } from '../modules/feedback/feedback.routes';
import { fileUploadRoutes } from '../modules/file-upload/file-upload.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { messageRoutes } from '../modules/message/message.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { oauthRoutes } from '../modules/oAuth/oAuth.routes';
import { paymentRoutes } from '../modules/payment/payment.routes';
import { paystackPaymentRoutes } from '../modules/paystackPayment/paystack.routes';
import { promoRoutes } from '../modules/promo/promo.routes';
import { promoUseRoutes } from '../modules/promoUse/promoUse.routes';
import { providerRoutes } from '../modules/provider/provider.routes';
import { questionRoutes } from '../modules/question/question.routes';
import { referralRoutes } from '../modules/referral/referral.routes';
import { referralUseRoutes } from '../modules/referralUse/referralUse.routes';
import { serviceRoutes } from '../modules/service/service.routes';
import { subscriberRoutes } from '../modules/subscriber/subscriber.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { taskRoutes } from '../modules/task/task.routes';
import { transactionRoutes } from '../modules/transaction/transaction.routes';
import { userRoutes } from '../modules/user/user.routes';

const router = Router();

const moduleRoutes = [
    {
        path: '/auth',
        router: authRoutes,
    },
    {
        path: '/user',
        router: userRoutes,
    },

    {
        path: '/manage',
        router: ManageRoutes,
    },
    {
        path: '/task',
        router: taskRoutes,
    },
    {
        path: '/bid',
        router: bidRoutes,
    },
    {
        path: '/promo',
        router: promoRoutes,
    },
    {
        path: '/promo-use',
        router: promoUseRoutes,
    },
    {
        path: '/provider',
        router: providerRoutes,
    },
    {
        path: '/notification',
        router: notificationRoutes,
    },

    {
        path: '/category',
        router: categoryRoutes,
    },
    {
        path: '/super-admin',
        router: superAdminRoutes,
    },
    {
        path: '/subscriber',
        router: subscriberRoutes,
    },
    {
        path: '/service',
        router: serviceRoutes,
    },
    {
        path: '/feedback',
        router: feedbackRoutes,
    },
    {
        path: '/question',
        router: questionRoutes,
    },
    {
        path: '/extension-request',
        router: extensionRequestRoutes,
    },
    {
        path: '/cancel-request',
        router: cancellationRequestRoutes,
    },
    {
        path: '/customer',
        router: CustomerRoutes,
    },
    {
        path: '/referral',
        router: referralRoutes,
    },
    {
        path: '/meta',
        router: metaRoutes,
    },
    {
        path: '/referralUse',
        router: referralUseRoutes,
    },
    {
        path: '/conversation',
        router: conversationRoutes,
    },
    {
        path: '/message',
        router: messageRoutes,
    },
    {
        path: '/file',
        router: fileUploadRoutes,
    },
    {
        path: '/paystack-payment',
        router: paystackPaymentRoutes,
    },
    {
        path: '/transaction',
        router: transactionRoutes,
    },
    {
        path: '/payment',
        router: paymentRoutes,
    },
    {
        path: '/admin',
        router: AdminRoutes,
    },
    {
        path: '/oauth',
        router: oauthRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
