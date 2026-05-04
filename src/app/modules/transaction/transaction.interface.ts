/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from './transaction.enum';

export interface ITransaction {
    provider?: Types.ObjectId;
    customer?: Types.ObjectId;
    task?: Types.ObjectId;

    type: TRANSACTION_TYPE;
    status: TRANSACTION_STATUS;

    amount: number;
    currency: string;

    // Stripe references
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    stripeTransferId?: string;
    stripePayoutId?: string;
    stripeRefundId?: string;

    stripeAccountId?: string;

    stripeEventId?: string;

    metadata?: Record<string, any>;

    description?: string;

    createdAt?: Date;
    updatedAt?: Date;
}
