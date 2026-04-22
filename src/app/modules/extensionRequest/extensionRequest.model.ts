import { model, Schema } from 'mongoose';
import { ENUM_EXTENSION_REQUEST_STATUS } from './extensionRequest.enum';
import { IExtensionRequest } from './extensionRequest.interface';

const extensionRequestSchema = new Schema<IExtensionRequest>(
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
        currentDate: {
            type: Date,
            required: true,
        },
        requestedDateTime: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_EXTENSION_REQUEST_STATUS),
            default: ENUM_EXTENSION_REQUEST_STATUS.PENDING,
        },
        extensionReason: { type: String, default: '' },
        extensionEvidence: { type: [String], default: [] },
        rejectDetails: { type: String, default: '' },
        reject_evidence: { type: String, default: '' },

        reviewedRequestAt: {
            type: Date,
            default: null,
        },
        type: {
            type: String,
            default: 'extension',
        },
        reasonForDecision: { type: String, default: '' },
    },
    { timestamps: true }
);

const ExtensionRequestModel = model<IExtensionRequest>(
    'ExtensionRequest',
    extensionRequestSchema
);
export default ExtensionRequestModel;
