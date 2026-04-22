/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import { payStackBaseUrl, platformChargePercentage } from '../../constant';
import AppError from '../../error/appError';
import { sendSinglePushNotification } from '../../helper/sendPushNotification';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import { ENUM_NOTIFICATION_TYPE } from '../notification/notification.enum';
import Notification from '../notification/notification.model';
import Payment from '../payment/payment.model';
import { ENUM_REFERRAL_USE_STATUS } from '../referralUse/referralUse.enum';
import ReferralUseModel from '../referralUse/referralUse.model';
import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';
import { User } from '../user/user.model';
import { ENUM_EXTENSION_REQUEST_STATUS } from './extensionRequest.enum';
import { IExtensionRequest } from './extensionRequest.interface';
import {
    default as extensionRequestModel,
    default as ExtensionRequestModel,
} from './extensionRequest.model';

const extensionRequestIntoDb = async (
    profileId: string,
    payload: Partial<IExtensionRequest>
) => {
    const requestExists = await ExtensionRequestModel.findOne({
        requestFrom: profileId,
        $or: [
            { status: ENUM_EXTENSION_REQUEST_STATUS.PENDING },
            { status: ENUM_EXTENSION_REQUEST_STATUS.DISPUTED },
        ],
        task: payload.task,
    });
    if (requestExists) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You have already submitted an extension request that has not been resolved yet. Once it is resolved, you can submit another request.'
        );
    }
    let currentUserRole;
    let requestToUserRole;
    let requestTo: any;
    const task = await TaskModel.findOne({
        $or: [{ provider: profileId }, { customer: profileId }],
        _id: payload.task,
    });
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    if (profileId == task.provider?.toString()) {
        currentUserRole = 'Provider';
        requestToUserRole = 'Customer';
        requestTo = task.customer;
    } else if (profileId == task.customer?.toString()) {
        currentUserRole = 'Customer';
        requestToUserRole = 'Provider';
        requestTo = task.provider;
    }

    if (task.status !== ENUM_TASK_STATUS.IN_PROGRESS) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Extension request can only be made for in-progress tasks'
        );
    }

    const extensionRequestData = {
        task: payload.task,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestFrom: profileId as any,
        requestTo: requestTo,
        requestedFromModel: currentUserRole,
        requestToModel: requestToUserRole,
        currentDate: task.preferredDeliveryDateTime,
        requestedDateTime: payload.requestedDateTime,
        reason: payload.reason,
    };
    const result = await extensionRequestModel.create(extensionRequestData);

    // ============================================
    // 🔥 SEND NOTIFICATION TO requestTo USER
    // ============================================

    const title = 'Extension Request';
    const message = `${currentUserRole} requested more time for the task "${task.title}"`;

    // Save notification
    await Notification.create({
        title,
        message,
        receiver: requestTo.toString(), // 👈 Send to the target user
        type: ENUM_NOTIFICATION_TYPE.EXTENSION_REQUEST,
        redirectLink: `${task._id}`,
    });

    // Send push notification
    const receiverUser = await User.findOne({ profileId: requestTo });

    if (receiverUser) {
        await sendSinglePushNotification(
            receiverUser._id.toString(),
            title,
            message,
            {
                taskId: task._id.toString(),
                type: ENUM_NOTIFICATION_TYPE.EXTENSION_REQUEST,
            }
        );
    }

    return result;
};

const getExtensionRequestByTaskFromDB = async (
    profileId: string,
    taskId: string
) => {
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }
    const isAuthorized =
        task.provider?.toString() === profileId ||
        task.customer?.toString() === profileId;
    if (!isAuthorized) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized to view this request'
        );
    }

    const result = await extensionRequestModel
        .find({ task: taskId })
        .populate('requestTo', 'name profile_image')
        .populate({ path: 'requestFrom', select: 'name profile_image' })
        .sort({ createdAt: -1 });

    return result;
};

const cancelExtensionRequestByTaskFromDB = async (
    profileId: string,
    extensionID: string
) => {
    const extensionRequest = await extensionRequestModel.findById(extensionID);
    if (!extensionRequest) {
        throw new AppError(httpStatus.NOT_FOUND, 'Extension Request not found');
    }

    if (extensionRequest.requestFrom.toString() !== profileId) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized to cancel this request'
        );
    }

    const result = await extensionRequestModel.findByIdAndDelete(extensionID);

    if (!result) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No extension request found for this task'
        );
    }
    return result;
};

const extensionRequestAcceptReject = async (
    profileId: string,
    extensionID: string,
    payload: {
        status: ENUM_EXTENSION_REQUEST_STATUS;
        rejectDetails?: string;
        reject_evidence?: string;
    }
) => {
    // Fetch extension request with task info
    const extensionRequest = await extensionRequestModel
        .findById(extensionID)
        .populate({
            path: 'task',
            select: 'provider customer preferredDeliveryDateTime',
        });

    if (!extensionRequest) {
        throw new AppError(httpStatus.NOT_FOUND, 'Extension Request not found');
    }

    const task: any = extensionRequest.task;
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    // Authorization check
    const isAuthorized =
        task.provider?.toString() === profileId ||
        task.customer?.toString() === profileId;

    if (!isAuthorized) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized to update this request'
        );
    }

    // APPROVE FLOW (Requires Transaction)
    if (payload.status === ENUM_EXTENSION_REQUEST_STATUS.ACCEPTED) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update request status
            const updatedExtension =
                await extensionRequestModel.findByIdAndUpdate(
                    extensionID,
                    { status: ENUM_EXTENSION_REQUEST_STATUS.ACCEPTED },
                    { new: true, runValidators: true, session }
                );

            if (!updatedExtension) {
                throw new AppError(
                    httpStatus.NOT_FOUND,
                    'Failed to approve extension request'
                );
            }

            // Update task delivery date
            await TaskModel.findByIdAndUpdate(
                task._id,
                {
                    preferredDeliveryDateTime:
                        extensionRequest.requestedDateTime,
                },
                { session }
            );

            await Notification.create({
                title: 'Extension Request Accepted',
                message: `You extension request has been accepted for the task "${task.title}"`,
                receiver: updatedExtension?.requestFrom.toString(),
                type: ENUM_NOTIFICATION_TYPE.EXTENSION_REQUEST_ACCEPTED,
                redirectLink: `${task._id}`,
            });
            sendSinglePushNotification(
                updatedExtension?.requestFrom.toString(),
                'Extension Request Rejected',
                `You extension request has been rejected for the task "${task.title}"`,
                { taskId: task._id.toString() }
            );

            await session.commitTransaction();
            session.endSession();

            return updatedExtension;
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }

    // REJECT FLOW (Simple update)
    if (payload.status === ENUM_EXTENSION_REQUEST_STATUS.REJECTED) {
        const updateData: Partial<IExtensionRequest> = {
            status: ENUM_EXTENSION_REQUEST_STATUS.REJECTED,
            rejectDetails: payload.rejectDetails,
            reject_evidence: payload.reject_evidence,
        };

        const result = await extensionRequestModel.findByIdAndUpdate(
            extensionID,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!result) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'Failed to reject request'
            );
        }

        await Notification.create({
            title: 'Extension Request Rejected',
            message: `You extension request has been rejected for the task "${task.title}"`,
            receiver: result?.requestFrom.toString(),
            type: ENUM_NOTIFICATION_TYPE.EXTENSION_REQUEST_REJECTED,
            redirectLink: `${task._id}`,
        });
        sendSinglePushNotification(
            result.requestFrom.toString(),
            'Extension Request Rejected',
            `You extension request has been rejected for the task "${task.title}"`,
            { taskId: task._id.toString() }
        );

        return result;
    }

    // If status is not supported
    throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid status: ${payload.status}`
    );
};
const resolveByAdmin = async (
    extensionID: string,
    payload: {
        status: ENUM_EXTENSION_REQUEST_STATUS;
        rejectDetails?: string;
        reject_evidence?: string;
    }
) => {
    // Fetch extension request with task info
    const extensionRequest = await extensionRequestModel
        .findById(extensionID)
        .populate({
            path: 'task',
            select: 'provider customer preferredDeliveryDateTime',
        });

    if (!extensionRequest) {
        throw new AppError(httpStatus.NOT_FOUND, 'Extension Request not found');
    }

    const task: any = extensionRequest.task;
    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
    }

    // APPROVE FLOW (Requires Transaction)
    if (payload.status === ENUM_EXTENSION_REQUEST_STATUS.ACCEPTED) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update request status
            const updatedExtension =
                await extensionRequestModel.findByIdAndUpdate(
                    extensionID,
                    { status: ENUM_EXTENSION_REQUEST_STATUS.RESOLVED },
                    { new: true, runValidators: true, session }
                );

            if (!updatedExtension) {
                throw new AppError(
                    httpStatus.NOT_FOUND,
                    'Failed to approve extension request'
                );
            }

            // Update task delivery date
            await TaskModel.findByIdAndUpdate(
                task._id,
                {
                    preferredDeliveryDateTime:
                        extensionRequest.requestedDateTime,
                },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            return updatedExtension;
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }

    // REJECT FLOW (Simple update)
    else if (payload.status === ENUM_EXTENSION_REQUEST_STATUS.REJECTED) {
        const updateData: Partial<IExtensionRequest> = {
            status: ENUM_EXTENSION_REQUEST_STATUS.RESOLVED,
            rejectDetails: payload.rejectDetails,
            reject_evidence: payload.reject_evidence,
        };

        const result = await extensionRequestModel.findByIdAndUpdate(
            extensionID,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!result) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'Failed to reject request'
            );
        }

        return result;
    }

    // If status is not supported
    throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid status: ${payload.status}`
    );
};

const makeDisputeForAdmin = async (profileId: string, extensionID: string) => {
    const extensionRequest: any = await ExtensionRequestModel.findOne({
        _id: extensionID,
        requestFrom: profileId,
    });
    if (!extensionRequest) {
        throw new AppError(httpStatus.NOT_FOUND, 'Extension Request not found');
    }
    const result = await ExtensionRequestModel.findByIdAndUpdate(
        extensionID,
        {
            status: ENUM_EXTENSION_REQUEST_STATUS.DISPUTED,
        },
        { new: true, runValidators: true }
    );
    return result;
};
// ------------------------
const getAllExtensionRequestFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || '';
    const filters: Record<string, any> = {};
    Object.keys(query).forEach((key) => {
        if (
            !['searchTerm', 'page', 'limit', 'sortBy', 'sortOrder'].includes(
                key
            )
        ) {
            filters[key] = query[key];
        }
    });

    const searchMatchStage = searchTerm
        ? {
              $or: [
                  { title: { $regex: searchTerm, $options: 'i' } },
                  { description: { $regex: searchTerm, $options: 'i' } },
              ],
          }
        : {};

    const sortBy: any = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortStage = { [sortBy]: sortOrder };

    const pipeline: any[] = [
        {
            $match: { ...filters, ...searchMatchStage },
        },
        { $sort: sortStage },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await ExtensionRequestModel.aggregate(pipeline);
    const result = aggResult[0]?.result || [];
    const total = aggResult[0]?.totalCount[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result,
    };
};

const getSingleExtensionRequest = async (id: string) => {
    const result = await ExtensionRequestModel.findById(id)
        .populate({
            path: 'requestFrom',
            select: 'name profile_image email',
        })
        .populate({ path: 'requestTo', select: 'name profile_image email' })
        .populate({
            path: 'task',
            select: 'title budget task_attachments description doneBy location preferredDeliveryDateTime statusWithDate address provider customer customerPayingAmount acceptedBidAmount',
            populate: [
                { path: 'customer', select: 'name profile_image email' },
                { path: 'provider', select: 'name profile_image email' },
            ],
        });

    return result;
};

const cancelTaskByAdmin = async (extensionId: string, payload: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!['Customer', 'Provider'].includes(payload.payTo)) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Invalid payTo value');
        }

        const extensionRequest =
            await ExtensionRequestModel.findById(extensionId).session(session);

        if (!extensionRequest) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'Extension Request not found'
            );
        }

        const task = await TaskModel.findById(extensionRequest.task).session(
            session
        );

        if (!task) {
            throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
        }

        /** ---------------- CUSTOMER REFUND ---------------- */
        if (payload.payTo === 'Customer') {
            const platformCharge =
                task.customerPayingAmount * platformChargePercentage;

            const refundableAmount = Math.max(
                task.customerPayingAmount - platformCharge,
                0
            );

            const updatedTask = await TaskModel.findByIdAndUpdate(
                task._id,
                {
                    status: ENUM_TASK_STATUS.CANCELLED,
                    paymentStatus: ENUM_PAYMENT_STATUS.REFUNDED,
                    $push: {
                        statusWithDate: {
                            status: ENUM_TASK_STATUS.CANCELLED,
                            date: new Date(),
                        },
                    },
                },
                { new: true, runValidators: true, session }
            );

            const response = await axios.post(
                `${payStackBaseUrl}/refund`,
                {
                    transaction: task.transactionId,
                    amount: Math.round(refundableAmount * 100),
                },
                {
                    headers: {
                        Authorization: `Bearer ${config.payStack.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            await ExtensionRequestModel.findByIdAndUpdate(
                extensionId,
                { status: ENUM_EXTENSION_REQUEST_STATUS.RESOLVED },
                { session }
            );

            await Payment.create(
                {
                    customer: task.customer,
                    task: task._id,
                    customerPayingAmount:
                        task.customerPayingAmount - platformCharge,
                    platformEarningAmount: platformCharge,
                },
                { session }
            );

            await session.commitTransaction();
            return { updatedTask, refundResponse: response.data };
        }

        /** ---------------- PROVIDER PAYMENT ---------------- */
        const referralUse = await ReferralUseModel.findOneAndUpdate(
            {
                referred: task.provider,
                status: ENUM_REFERRAL_USE_STATUS.ACTIVE,
            },
            { status: ENUM_REFERRAL_USE_STATUS.USED },
            {
                new: true,
                sort: { createdAt: 1 },
                session,
            }
        );

        const acceptedAmount = task.acceptedBidAmount ?? 0;
        const referralBonus = referralUse?.value ?? 0;

        const platformCharge = acceptedAmount * platformChargePercentage;

        const providerAmount = Math.max(
            acceptedAmount + referralBonus - platformCharge,
            0
        );

        const updatedTask = await TaskModel.findByIdAndUpdate(
            task._id,
            {
                status: ENUM_TASK_STATUS.CANCELLED,
                paymentStatus: ENUM_PAYMENT_STATUS.PAID_TO_PROVIDER,
                providerEarningAmount: providerAmount,
                $push: {
                    statusWithDate: {
                        status: ENUM_TASK_STATUS.CANCELLED,
                        date: new Date(),
                    },
                },
            },
            { new: true, runValidators: true, session }
        );

        await Payment.create(
            [
                {
                    provider: task.provider,
                    customer: task.customer,
                    task: task._id,
                    amount: providerAmount,
                    customerPayingAmount: task.customerPayingAmount,
                    platformEarningAmount:
                        task.customerPayingAmount - providerAmount,
                },
            ],
            { session }
        );

        await ExtensionRequestModel.findByIdAndUpdate(
            extensionId,
            { status: ENUM_EXTENSION_REQUEST_STATUS.RESOLVED },
            { session }
        );

        await session.commitTransaction();
        return {
            updatedTask,
            message: 'Provider payment processed successfully',
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const ExtensionRequestServices = {
    extensionRequestIntoDb,
    getExtensionRequestByTaskFromDB,
    cancelExtensionRequestByTaskFromDB,
    extensionRequestAcceptReject,
    makeDisputeForAdmin,
    resolveByAdmin,
    getAllExtensionRequestFromDB,
    getSingleExtensionRequest,
    cancelTaskByAdmin,
};
export default ExtensionRequestServices;
