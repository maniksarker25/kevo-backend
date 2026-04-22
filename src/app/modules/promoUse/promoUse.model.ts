import { model, Schema } from 'mongoose';
import { IPromoUse } from './promoUse.interface';

const promoUseSchema = new Schema<IPromoUse>(
    {
        promo: {
            type: Schema.Types.ObjectId,
            ref: 'Promo',
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
    },
    { timestamps: true }
);

const PromoUseModel = model<IPromoUse>('PromoUse', promoUseSchema);
export default PromoUseModel;
