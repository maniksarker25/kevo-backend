/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/multer-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import serviceServices from './service.service';

const createService = catchAsync(async (req, res) => {
    if (req.files?.service_image) {
        req.body.images = req.files.service_image.map((file: any) => {
            return getCloudFrontUrl(file.key);
        });
    }
    const result = await serviceServices.createServiceIntoDB(
        req.user?.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Service Create Successfully',
        data: result,
    });
});
const getAllService = catchAsync(async (req, res) => {
    const result = await serviceServices.getAllServiceFromDB(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All Service Get Successfully',
        data: result,
    });
});
const getMyService = catchAsync(async (req, res) => {
    const result = await serviceServices.getMyService(
        req.user.profileId,
        req.query
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Services retrieved Successfully',
        data: result,
    });
});
const deleteService = catchAsync(async (req, res) => {
    const profileId = req.user?.profileId;
    const serviceId = req.params.id;
    const result = await serviceServices.deleteServiceFromDB(
        profileId,
        serviceId
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Delete Service  Successfully',
        data: result,
    });
});
const inactiveService = catchAsync(async (req, res) => {
    const profileId = req.user?.profileId;
    const serviceId = req.params.id as string;
    const result = await serviceServices.toggleServiceActiveStatusFromDB(
        profileId,
        serviceId
    );

    const message = result.isActive
        ? 'Service activated successfully'
        : 'Service deactivated successfully';
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message,
        data: result,
    });
});
const getSingleService = catchAsync(async (req, res) => {
    const result = await serviceServices.getSingleServiceFromDB(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Single Service get Successfully',
        data: result,
    });
});
const updateService = catchAsync(async (req, res) => {
    if (req.files?.service_image) {
        req.body.newImages = req.files.service_image.map((file: any) => {
            return getCloudFrontUrl(file.key);
        });
    }
    const result = await serviceServices.updateServiceFromDB(
        req.user?.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Service updated Successfully',
        data: result,
    });
});

const ServiceController = {
    createService,
    getAllService,
    deleteService,
    getSingleService,
    inactiveService,
    updateService,
    getMyService,
};
export default ServiceController;
