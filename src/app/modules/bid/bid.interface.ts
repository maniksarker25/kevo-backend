import { Types } from 'mongoose';
import { ENUM_BID_STATUS } from './bid.enum';

export interface IBid {
    provider: Types.ObjectId;
    task: Types.ObjectId;
    providerProposedAmount: number;
    customerProposedAmount: number;
    status: (typeof ENUM_BID_STATUS)[keyof typeof ENUM_BID_STATUS];
}
