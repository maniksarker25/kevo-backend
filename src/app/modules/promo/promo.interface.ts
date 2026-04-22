import { ENUM_DISCOUNT_TYPE, ENUM_PROMO_STATUS } from './promo.enum';

export interface IPromo {
    promoCode: string;
    promoType: string;
    discountType: (typeof ENUM_DISCOUNT_TYPE)[keyof typeof ENUM_DISCOUNT_TYPE];
    discountNum: number;
    limit: number;
    startDate: Date;
    endDate: Date;
    status: (typeof ENUM_PROMO_STATUS)[keyof typeof ENUM_PROMO_STATUS];
}
