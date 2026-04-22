import { Types } from 'mongoose';

export interface IFeedback {
    task: Types.ObjectId; // ref -> Task
    provider: Types.ObjectId; // ref -> Provider
    customer: Types.ObjectId; // ref -> Customer
    service: Types.ObjectId;
    rating: number;
    details: string;
}
