import { model, Schema } from 'mongoose';
import { IDispute } from './dispute.interface';
import { ENUM_DISPUTE_REQUEST_TYPE, ENUM_DISPUTE_STATUS } from './dispute.enum';

const disputeSchema = new Schema<IDispute>(
    {
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        requestType: {
            type: String,
            enum: Object.values(ENUM_DISPUTE_REQUEST_TYPE),
            required: true,
        },
        requestBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_DISPUTE_STATUS),
            default: ENUM_DISPUTE_STATUS.PENDING,
        },
        extensionRequest: {
            type: Schema.Types.ObjectId,
            ref: 'ExtensionRequest',
        },
        cancellationRequest: {
            type: Schema.Types.ObjectId,
            ref: 'CancellationRequest',
        },
        requestTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const DisputeModel = model<IDispute>('Dispute', disputeSchema);
export default DisputeModel;
