/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../error/appError';
import { sendSinglePushNotification } from '../../helper/sendPushNotification';
import {
    ENUM_PAYMENT_PURPOSE,
    ENUM_PAYMENT_STATUS,
} from '../../utilities/enum';
import BidModel from '../bid/bid.model';
import { ENUM_NOTIFICATION_TYPE } from '../notification/notification.enum';
import Notification from '../notification/notification.model';
import PromoUseModel from '../promoUse/promoUse.model';
import { ENUM_REFERRAL_USE_STATUS } from '../referralUse/referralUse.enum';
import ReferralUseModel from '../referralUse/referralUse.model';
import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import {
    ENUM_TRANSACTION_REASON,
    ENUM_TRANSACTION_TYPE,
} from '../transaction/transaction.enum';
import Transaction from '../transaction/transaction.model';
// handle pay-stack webhook
const handlePaystackWebhook = async (req: any) => {
    console.log('Handling Pay-stack webhook...');
    try {
        const hash = crypto
            .createHmac('sha512', config.payStack.secretKey as string)
            .update(JSON.stringify(req.body))
            .digest('hex');
        if (hash == req.headers['x-paystack-signature']) {
            // Retrieve the request's body
            const event = req.body;
            console.log('Pay-stack Webhook Event:', event);
            // Handle the event
            switch (event.event) {
                case 'charge.success':
                    console.log('Charge was successful:', event.data);
                    // Then define and call a method to handle the successful charge.
                    if (
                        event.data.metadata &&
                        event.data.metadata.paymentPurpose ===
                            ENUM_PAYMENT_PURPOSE.BID_ACCEPT
                    ) {
                        return await handleBidAcceptPayment(
                            event.data.metadata,
                            event.data.amount / 100,
                            event.data.id,
                            event.data.reference
                        );
                    }
                    break;
                case 'charge.failed':
                    console.log('Charge failed:', event.data);
                    // Then define and call a method to handle the failed charge.
                    break;
                // ... handle other event types
                default:
                    console.log(`Unhandled event type ${event.event}`);
            }
        }
    } catch (error) {
        console.error('Error handling Pay-stack webhook:', error);
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Webhook handling failed'
        );
    }
};

const handleBidAcceptPayment = async (
    metaData: any,
    amount: number,
    transactionId: string,
    referenceId: string
) => {
    const task = await TaskModel.findById(metaData.taskId);
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }
    const bid: any = await BidModel.findById(metaData.bidId).populate({
        path: 'provider',
        populate: { path: 'user' },
    });
    if (!bid) {
        throw new AppError(httpStatus.NOT_FOUND, 'Bid not found');
    }
    await TaskModel.findByIdAndUpdate(
        task._id,
        {
            $set: {
                provider: bid.provider,
                status: ENUM_TASK_STATUS.IN_PROGRESS,
                paymentStatus: ENUM_PAYMENT_STATUS.PAID,
                transactionId,
                customerPayingAmount: amount,
                paymentReferenceId: referenceId,
                acceptedBidAmount: bid.price,
            },
            statusWithDate: [
                { status: ENUM_TASK_STATUS.OFFERED, date: bid.createdAt },
                { status: ENUM_TASK_STATUS.IN_PROGRESS, date: Date.now() },
            ],
        },
        { new: true }
    );

    if (metaData.promoId) {
        await PromoUseModel.create({
            customer: task.customer,
            task: task._id,
            promo: metaData.promoId,
        });
    }
    if (metaData.referralUseId) {
        await ReferralUseModel.findByIdAndUpdate(
            metaData.referralUseId,
            { status: ENUM_REFERRAL_USE_STATUS.USED },
            { new: true, runValidators: true }
        );
    }
    await Transaction.create({
        amount: amount,
        type: ENUM_TRANSACTION_TYPE.DEBIT,
        transactionId,
        reason: ENUM_TRANSACTION_REASON.BID_ACCEPT_PAYMENT,
        user: task.customer,
        userType: 'Customer',
    });

    const taskTitle = task?.title || 'Your task';

    const notificationData = [
        {
            title: 'Bid Accepted by Tasker',
            message: `Bid for "${taskTitle}" has been accepted by the tasker. Task is now in progress.`,
            receiver: bid.provider._id.toString(),
            type: ENUM_NOTIFICATION_TYPE.BID_ACCEPTED,
            redirectLink: `${task._id}`,
        },
        {
            title: 'Bid Accepted Successfully',
            message: `Bid for your task "${taskTitle}" has been accepted successfully. Task is now in progress.`,
            receiver: task.customer._id,
            type: ENUM_NOTIFICATION_TYPE.BID_ACCEPTED,
            redirectLink: `${task._id}`,
        },
    ];
    Notification.insertMany(notificationData);

    if (bid.provider.user) {
        await sendSinglePushNotification(
            bid.provider.user._id.toString(),
            'Task Accepted',
            `Your bid has been accepted for task "${taskTitle}"`,
            {
                taskId: bid.task.toString(),
                type: ENUM_NOTIFICATION_TYPE.TASK_ACCEPTED,
            }
        );
    }
};

const PaystackPaymentService = {
    handlePaystackWebhook,
};
export default PaystackPaymentService;
