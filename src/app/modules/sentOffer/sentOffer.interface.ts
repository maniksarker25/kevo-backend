import { Types } from 'mongoose';

export interface ISentOffer {
    provider: Types.ObjectId; // ref -> Provider
    service: Types.ObjectId; // ref -> Service
    customer: Types.ObjectId; // ref -> Customer
}
