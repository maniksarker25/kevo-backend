import { Router } from 'express';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { bidRoutes } from '../modules/bid/bid.routes';
import { conversationRoutes } from '../modules/conversation/conversation.routes';
import { CustomerRoutes } from '../modules/customer/customer.routes';
import { fileUploadRoutes } from '../modules/file-upload/file-upload.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { messageRoutes } from '../modules/message/message.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { paymentRoutes } from '../modules/payment/payment.routes';
import { providerRoutes } from '../modules/provider/provider.routes';
import { ratingRoutes } from '../modules/rating/rating.routes';
import { referralRoutes } from '../modules/referral/referral.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { supportRoutes } from '../modules/support/support.routes';
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
        path: '/provider',
        router: providerRoutes,
    },
    {
        path: '/notification',
        router: notificationRoutes,
    },

    {
        path: '/super-admin',
        router: superAdminRoutes,
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
        path: '/rating',
        router: ratingRoutes,
    },
    {
        path: '/support',
        router: supportRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
