import { model, Schema } from 'mongoose';
import { ENUM_DISCOUNT_TYPE, ENUM_PROMO_STATUS } from './promo.enum';
import { IPromo } from './promo.interface';

const promoSchema = new Schema<IPromo>(
    {
        promoCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        promoType: {
            type: String,
            required: true,
        },
        discountType: {
            type: String,
            enum: Object.values(ENUM_DISCOUNT_TYPE),
            required: true,
        },
        discountNum: {
            type: Number,
            required: true,
        },
        limit: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_PROMO_STATUS),
            default: ENUM_PROMO_STATUS.UPCOMING,
        },
    },
    { timestamps: true }
);

const PromoModel = model<IPromo>('Promo', promoSchema);
export default PromoModel;
