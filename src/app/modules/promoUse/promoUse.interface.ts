import { Schema } from 'mongoose';

export interface IPromoUse {
    promo: Schema.Types.ObjectId;
    customer: Schema.Types.ObjectId;
    task: Schema.Types.ObjectId;
}
