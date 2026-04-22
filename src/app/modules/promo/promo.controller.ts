import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import promoServices from './promo.service';

const createPromo = catchAsync(async (req, res) => {
    const result = await promoServices.createPromoIntoDB(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promo created successfully',
        data: result,
    });
});

const getAllPromo = catchAsync(async (req, res) => {
    const result = await promoServices.getAllPromoFromDB(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promos fetched successfully',
        data: result,
    });
});

const getSinglePromo = catchAsync(async (req, res) => {
    const result = await promoServices.getSinglePromoFromDB(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promo fetched successfully',
        data: result,
    });
});
const updatePromo = catchAsync(async (req, res) => {
    const result = await promoServices.updatePromoInDB(req.params.id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promo updated successfully',
        data: result,
    });
});
const deletePromo = catchAsync(async (req, res) => {
    const result = await promoServices.deletePromoFromDB(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promo deleted successfully',
        data: result,
    });
});
const verifyPromo = catchAsync(async (req, res) => {
    const result = await promoServices.verifyPromoFromDB(
        req.user.profileId,
        req.body.promoCode
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promo verify successfully',
        data: result,
    });
});

const PromoController = {
    createPromo,
    getAllPromo,
    getSinglePromo,
    updatePromo,
    deletePromo,
    verifyPromo,
};
export default PromoController;
