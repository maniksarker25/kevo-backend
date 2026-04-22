import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import promoUseServices from './promoUse.service';

const getAllPromoUses = catchAsync(async (req, res) => {
    const result = await promoUseServices.getAllPromoUsesFromDB(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'PromoUses fetched successfully',
        data: result,
    });
});

const PromoUseController = {
    getAllPromoUses,
};
export default PromoUseController;
