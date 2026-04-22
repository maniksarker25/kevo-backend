/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import ProviderServices from './provider.service';

const updateProvider = catchAsync(async (req, res) => {
    const { id, data } = req.body;
    const result = await ProviderServices.updateProviderFromDB(id, data);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Provider Update successfully',
        data: result,
    });
});
const getAllProvider = catchAsync(async (req, res) => {
    const result = await ProviderServices.getAllProviderFromDB(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Provider get loockup successfully',
        data: result,
    });
});
const getSingleProvider = catchAsync(async (req, res) => {
    const result = await ProviderServices.getSingleProvider(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Single provider retrieved successfully',
        data: result,
    });
});

const getProviderMetaData = catchAsync(async (req, res) => {
    const result = await ProviderServices.getProviderMetaDataFromDB(
        req.user.profileId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Provider meta data retrieved successfully',
        data: result,
    });
});

const completeIdentityVerification = catchAsync(async (req, res) => {
    const identification_document_file: any =
        req.files?.identification_document;
    if (req.files?.identification_document) {
        req.body.identification_document = getCloudFrontUrl(
            identification_document_file[0].key
        );
    }
    const result = await ProviderServices.completeIdentityVerificationFromDB(
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message:
            req.body.identificationDocumentType === 'BVN'
                ? 'Bank Verification Number verified successfully'
                : 'Identity verification completed successfully',
        data: result,
    });
});

const verifyBVN = catchAsync(async (req, res) => {
    const { bvn } = req.body;
    const result = await ProviderServices.verifyBVN(req.user.profileId, bvn);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Bank Verification Number verified successfully',
        data: result,
    });
});

const ProviderController = {
    getAllProvider,
    updateProvider,
    getSingleProvider,
    getProviderMetaData,
    completeIdentityVerification,
    verifyBVN,
};
export default ProviderController;
