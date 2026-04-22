import { Types } from 'mongoose';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';

export interface IPayment {
    provider: Types.ObjectId;
    customer: Types.ObjectId;
    status: (typeof ENUM_PAYMENT_STATUS)[keyof typeof ENUM_PAYMENT_STATUS];
    task: Types.ObjectId;
    amount: number;
    customerPayingAmount?: number;
    platformEarningAmount?: number;
}
