/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { ENUM_PAYMENT_PURPOSE } from '../utilities/enum';

const handlePaymentSuccess = async (
    metaData: any,
    transactionId: string,
    amount: number
) => {
    if (metaData.paymentPurpose == ENUM_PAYMENT_PURPOSE.BID_ACCEPT) {
        await handleBidAcceptPayment(metaData.userId, transactionId, amount);
    }
};

const handleBidAcceptPayment = async (
    userId: string,
    transactionId: string,
    amount: number
) => {};

export default handlePaymentSuccess;
