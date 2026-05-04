import { model, Schema } from 'mongoose';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from './transaction.enum';
import { ITransaction } from './transaction.interface';

const transactionSchema = new Schema(
    {
        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            index: true,
        },

        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            default: null,
        },

        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            index: true,
        },

        type: {
            type: String,
            enum: Object.values(TRANSACTION_TYPE),
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: Object.values(TRANSACTION_STATUS),
            default: TRANSACTION_STATUS.PENDING,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            default: 'usd',
        },

        // 🔗 Stripe references
        stripePaymentIntentId: { type: String, index: true },
        stripeChargeId: { type: String },
        stripeTransferId: { type: String, index: true },
        stripePayoutId: { type: String, index: true },
        stripeRefundId: { type: String },

        stripeAccountId: {
            type: String,
            index: true,
        },

        stripeEventId: {
            type: String,
            unique: true, // prevents duplicate webhook processing
            sparse: true,
        },

        metadata: {
            type: Schema.Types.Mixed,
        },

        description: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Transaction = model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
