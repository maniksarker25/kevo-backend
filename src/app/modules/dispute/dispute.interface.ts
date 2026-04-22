import { Types } from 'mongoose';
import { ENUM_DISPUTE_REQUEST_TYPE, ENUM_DISPUTE_STATUS } from './dispute.enum';

export interface IDispute {
    task: Types.ObjectId; // ref -> Task
    requestType: (typeof ENUM_DISPUTE_REQUEST_TYPE)[keyof typeof ENUM_DISPUTE_REQUEST_TYPE];
    requestBy: Types.ObjectId; // ref -> User
    status: (typeof ENUM_DISPUTE_STATUS)[keyof typeof ENUM_DISPUTE_STATUS];
    extensionRequest?: Types.ObjectId; // ref -> ExtentionRequest
    cancellationRequest?: Types.ObjectId; // ref -> CancellationRequest
    requestTo: Types.ObjectId; // ref -> User
}
