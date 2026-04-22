import { Types } from 'mongoose';

export interface IBid {
    provider: Types.ObjectId;
    task: Types.ObjectId;
    providerProposedAmount: number;
    customerProposedAmount: number;
}
