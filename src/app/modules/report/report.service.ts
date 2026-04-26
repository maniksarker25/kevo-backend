import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IReport } from "./report.interface";
import reportModel from "./report.model";

const updateUserProfile = async (id: string, payload: Partial<IReport>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await reportModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await reportModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const ReportServices = { updateUserProfile };
export default ReportServices;