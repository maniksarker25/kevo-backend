import httpStatus from 'http-status';
import cron from 'node-cron';
import AppError from '../../error/appError';
import PromoUseModel from '../promoUse/promoUse.model';
import { IPromo } from './promo.interface';
import PromoModel from './promo.model';

import { ENUM_PROMO_STATUS } from './promo.enum';

const createPromoIntoDB = async (payload: IPromo) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(payload.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate <= today) {
        payload.status = ENUM_PROMO_STATUS.ACTIVE;
    }

    const result = await PromoModel.create(payload);
    return result;
};

const getAllPromoFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const result = await PromoModel.find().skip(skip).limit(limit).sort({
        createdAt: -1,
    });

    const total = await PromoModel.countDocuments();
    const totalPage = Math.ceil(total / limit);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Promos not found');
    }
    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result,
    };
};
const getSinglePromoFromDB = async (id: string) => {
    const result = await PromoModel.findById(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Promo not found');
    }
    return result;
};
const updatePromoInDB = async (id: string, payload: Partial<IPromo>) => {
    const result = await PromoModel.findByIdAndUpdate(id, payload, {
        new: true,
    });
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Promo not found');
    }
    return result;
};
const deletePromoFromDB = async (id: string) => {
    const result = await PromoModel.findByIdAndDelete(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Promo not found');
    }
    return result;
};
const verifyPromoFromDB = async (customerId: string, promoCode: string) => {
    const promo = await PromoModel.findOne({ promoCode });

    // Promo Not Found
    if (!promo) {
        throw new AppError(httpStatus.NOT_FOUND, 'Promo code is not valid');
    }

    const now = new Date();

    // If promo has not started yet
    if (promo.startDate > now) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Promo is not active yet');
    }

    // If promo expired
    if (promo.endDate < now) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Promo code has expired');
    }

    // Promo status must be ACTIVE
    if (promo.status !== 'ACTIVE') {
        throw new AppError(httpStatus.BAD_REQUEST, 'Promo is not active');
    }
    const promoUse = await PromoUseModel.countDocuments({ promo: promo._id });
    if (promoUse >= promo.limit) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Promo uses limit reached,this code is not valid now'
        );
    }
    const promoUseExist = await PromoUseModel.findOne({
        customer: customerId,
        promo: promo._id,
    });
    if (promoUseExist) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You have already used this promo code'
        );
    }
    return promo;
};

// Runs at 12:00 AM and 12:00 PM every day
cron.schedule('0 0,12 * * *', async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await PromoModel.updateMany(
            {
                status: ENUM_PROMO_STATUS.UPCOMING,
                startDate: { $lte: today },
                endDate: { $gte: today },
            },
            {
                $set: { status: ENUM_PROMO_STATUS.ACTIVE },
            }
        );

        await PromoModel.updateMany(
            {
                endDate: { $lt: today },
                status: { $ne: ENUM_PROMO_STATUS.EXPIRED },
            },
            {
                $set: { status: ENUM_PROMO_STATUS.EXPIRED },
            }
        );

        console.log('✅ Promo status cron executed successfully');
    } catch (error) {
        console.error('❌ Promo status cron failed:', error);
    }
});

const PromoServices = {
    createPromoIntoDB,
    getAllPromoFromDB,
    getSinglePromoFromDB,
    updatePromoInDB,
    deletePromoFromDB,
    verifyPromoFromDB,
};
export default PromoServices;
