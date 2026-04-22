import { Types } from 'mongoose';
import {
    ENUM_TRANSACTION_REASON,
    ENUM_TRANSACTION_TYPE,
} from './transaction.enum';

export interface ITransaction {
    amount: number;
    type: (typeof ENUM_TRANSACTION_TYPE)[keyof typeof ENUM_TRANSACTION_TYPE];
    transactionId: string;
    reason: (typeof ENUM_TRANSACTION_REASON)[keyof typeof ENUM_TRANSACTION_REASON];
    user: Types.ObjectId;
    userType: 'Customer' | 'Provider';
}
