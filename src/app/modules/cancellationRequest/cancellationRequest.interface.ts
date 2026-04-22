import { Types } from 'mongoose';
import { ENUM_CANCELLATION_REQUEST_STATUS } from './cancellationRequest.enum';

export interface ICancellationRequest {
    task: Types.ObjectId;
    requestFrom: Types.ObjectId;
    requestedFromModel: 'Customer' | 'Provider';
    requestTo: Types.ObjectId;
    requestToModel: 'Customer' | 'Provider';
    currentDate: Date;
    reason: string;
    status: (typeof ENUM_CANCELLATION_REQUEST_STATUS)[keyof typeof ENUM_CANCELLATION_REQUEST_STATUS];
    rejectDetails?: string;
    reject_evidence: string[];
    reviewedRequestAt?: Date;
    cancellationReason?: string;
    cancellationEvidence?: string[];
    type: string;
    reasonForDecision?: string;
}
