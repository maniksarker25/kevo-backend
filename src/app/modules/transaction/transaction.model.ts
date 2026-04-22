import { model, Schema } from 'mongoose';
import {
    ENUM_TRANSACTION_REASON,
    ENUM_TRANSACTION_TYPE,
} from './transaction.enum';
import { ITransaction } from './transaction.interface';

const transactionSchema = new Schema<ITransaction>(
    {
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(ENUM_TRANSACTION_TYPE),
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        reason: {
            type: String,
            enum: Object.values(ENUM_TRANSACTION_REASON),
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            refPath: 'userType',
            required: true,
        },
        userType: {
            type: String,
            required: true,
            enum: ['Customer', 'Provider'],
        },
    },
    { timestamps: true }
);

const Transaction = model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
