import { Types } from 'mongoose';

export interface IBid {
    provider: Types.ObjectId; // ref -> Provider
    task: Types.ObjectId; // ref -> Task
    price: number;
    details: string;
}
