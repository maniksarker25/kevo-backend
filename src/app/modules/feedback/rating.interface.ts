import { Types } from 'mongoose';

export interface IRating {
    task: Types.ObjectId;
    provider: Types.ObjectId;
    customer: Types.ObjectId;
    rating: number;
    details: string;
}
