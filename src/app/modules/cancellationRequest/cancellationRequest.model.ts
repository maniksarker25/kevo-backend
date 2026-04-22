import { model, Schema } from 'mongoose';
import { ENUM_CANCELLATION_REQUEST_STATUS } from './cancellationRequest.enum';
import { ICancellationRequest } from './cancellationRequest.interface';

const extensionRequestSchema = new Schema<ICancellationRequest>(
    {
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        requestFrom: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'requestedFromModel',
        },
        requestedFromModel: {
            type: String,
            required: true,
            enum: ['Customer', 'Provider'],
        },
        requestTo: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'requestToModel',
        },
        requestToModel: {
            type: String,
            required: true,
            enum: ['Customer', 'Provider'],
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_CANCELLATION_REQUEST_STATUS),
            default: ENUM_CANCELLATION_REQUEST_STATUS.PENDING,
        },
        rejectDetails: { type: String, default: '' },
        reject_evidence: { type: [String], default: [] },

        reviewedRequestAt: {
            type: Date,
            default: null,
        },
        cancellationReason: { type: String, default: '' },
        cancellationEvidence: { type: [String], default: [] },
        type: {
            type: String,
            default: 'extension',
        },
        reasonForDecision: { type: String, default: '' },
    },
    { timestamps: true }
);

const CancellationRequestModel = model<ICancellationRequest>(
    'CancellationRequest',
    extensionRequestSchema
);
export default CancellationRequestModel;
