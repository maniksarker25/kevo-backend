/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import httpStatus from 'http-status';
import AppError from '../error/appError';
import NormalUser from '../modules/normalUser/normalUser.model';
import {
  ENUM_COLLABORATION_STATUS,
  ENUM_PAYMENT_PURPOSE,
  ENUM_TRANSACTION_TYPE,
} from '../utilities/enum';
import Collaboration from '../modules/collaboration/collaboration.model';
import Transaction from '../modules/transaction/transaction.model';
import { INormalUser } from '../modules/normalUser/normalUser.interface';
import { getIO } from '../socket/socketManager';
import Notification from '../modules/notification/notification.model';
import getUserNotificationCount from '../helper/getUserNotificationCount';

const handlePaymentSuccess = async (
  metaData: any,
  transactionId: string,
  amount: number,
) => {
  if (metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.PURCHASE_SUBSCRIPTION) {
    await handleSubcriptionPurchaseSuccess(
      metaData.userId,
      transactionId,
      amount,
    );
  } else if (
    metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.RENEW_SUBSCRIPTION
  ) {
    await handleSubscriptionRenewSuccess(
      metaData.userid,
      transactionId,
      amount,
    );
  } else if (
    metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.COLLABRATE_PAYMENT
  ) {
    await handleCollabratePaymentSuccess(
      metaData?.collaborationId,
      transactionId,
      amount,
    );
  }
};

const handleSubcriptionPurchaseSuccess = async (
  userId: string,
  transactionId: string,
  amount: number,
) => {
  const io = getIO();
  const normalUser = await NormalUser.findById(userId);
  if (!normalUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  await NormalUser.findByIdAndUpdate(
    userId,
    {
      subscriptionPurchaseDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isPremium: true,
    },
    { new: true, runValidators: true },
  );
  await Transaction.create({
    user: normalUser?._id,
    email: normalUser?.email,
    type: ENUM_TRANSACTION_TYPE.PURCHASE_SUBSCRIPTION,
    amount: amount,
    transactionId,
  });

  await Notification.create({
    title: 'Subscription purchase successful',
    message: `Congratullations you successfully purchase subscription`,
    receiver: userId,
  });
  const updatedNotificationCount = await getUserNotificationCount(userId);
  io.to(userId.toString()).emit('notifications', updatedNotificationCount);
};

const handleSubscriptionRenewSuccess = async (
  userId: string,
  transactionId: string,
  amount: number,
) => {
  const io = getIO();
  const normalUser = await NormalUser.findById(userId);
  if (!normalUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  await NormalUser.findByIdAndUpdate(
    userId,
    {
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionRenewDate: new Date(),
    },
    { new: true, runValidators: true },
  );
  await Transaction.create({
    user: normalUser?._id,
    email: normalUser?.email,
    type: ENUM_TRANSACTION_TYPE.RENEW_SUBSCRIPTION,
    amount: amount,
    transactionId,
  });

  await Notification.create({
    title: 'Subscription renew successful',
    message: `Congratullations you successfully renew subscription`,
    receiver: userId,
  });
  const updatedNotificationCount = await getUserNotificationCount(userId);
  io.to(userId.toString()).emit('notifications', updatedNotificationCount);
};

const handleCollabratePaymentSuccess = async (
  collaborationId: string,
  transactionId: string,
  amount: number,
) => {
  const io = getIO();
  const collaboration = await Collaboration.findById(collaborationId)
    .populate({
      path: 'receiver',
      select: 'email name',
    })
    .populate({ path: 'sender', select: 'name' });
  if (!collaboration) {
    throw new AppError(httpStatus.NOT_FOUND, 'Collaboration not found');
  }
  await Collaboration.findByIdAndUpdate(
    collaborationId,
    { status: ENUM_COLLABORATION_STATUS.UPCOMING },
    { new: true, runValidators: true },
  );
  const receiver = collaboration.receiver as INormalUser;
  await Transaction.create({
    user: collaboration?.receiver,
    email: receiver?.email,
    type: ENUM_TRANSACTION_TYPE.COLLABORATION,
    amount: amount,
    transactionId,
  });

  await Notification.create({
    title: 'Collaboration request accepted',
    message: `Congratullations your collaboration request accepted by ${receiver.name}`,
    receiver: collaboration.sender._id,
  });
  const updatedNotificationCount = await getUserNotificationCount(
    collaboration.sender._id,
  );
  io.to(collaboration.sender._id.toString()).emit(
    'notifications',
    updatedNotificationCount,
  );
};

export default handlePaymentSuccess;
