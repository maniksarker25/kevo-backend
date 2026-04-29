/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { ENUM_TASK_STATUS } from '../modules/task/task.enum';
import TaskModel from '../modules/task/task.model';
import { ENUM_PAYMENT_PURPOSE, ENUM_PAYMENT_STATUS } from '../utilities/enum';

const handlePaymentSuccess = async (
    metaData: any,
    transactionId: string,
    amount: number
) => {
    if (metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.BID_ACCEPT) {
        await handleBidAcceptPayment(metaData, transactionId, amount);
    }
};

const handleBidAcceptPayment = async (
    metaData: any,
    transactionId: string,
    amount: number
) => {
    const { taskId } = metaData;
    const task = await TaskModel.findById(taskId);
    if (!task) {
        console.error(`Task with ID ${taskId} not found.`);
        return;
    }
    await TaskModel.findByIdAndUpdate(
        taskId,
        {
            status: ENUM_TASK_STATUS.ASSIGNED,
            paymentStatus: ENUM_PAYMENT_STATUS.PAID_BY_CUSTOMER,
            transactionId,
            amount,
        },
        { new: true }
    );
};

export default handlePaymentSuccess;
