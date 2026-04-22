import { Types } from 'mongoose';
import { ENUM_EXTENSION_REQUEST_STATUS } from './extensionRequest.enum';

export interface IExtensionRequest {
    task: Types.ObjectId;
    requestFrom: Types.ObjectId;
    requestedFromModel: 'Customer' | 'Provider';
    requestTo: Types.ObjectId;
    requestToModel: 'Customer' | 'Provider';
    currentDate: Date;
    requestedDateTime: Date;
    reason: string;
    status: (typeof ENUM_EXTENSION_REQUEST_STATUS)[keyof typeof ENUM_EXTENSION_REQUEST_STATUS];
    rejectDetails?: string;
    reject_evidence: string;
    reviewedRequestAt?: Date;
    extensionReason?: string;
    extensionEvidence?: string[];
    type: string;
    reasonForDecision?: string;
}
