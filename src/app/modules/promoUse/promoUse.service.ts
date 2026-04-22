import httpStatus from 'http-status';
import AppError from '../../error/appError';
import promoUseModel from './promoUse.model';

const getAllPromoUsesFromDB = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const result = await promoUseModel
        .find()
        .populate('promo customer task')
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({
            createdAt: -1,
        });
    const total = await promoUseModel.countDocuments();
    const totalPage = Math.ceil(total / limit);

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Promo uses not found');
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

const PromoUseServices = {
    getAllPromoUsesFromDB,
};
export default PromoUseServices;
