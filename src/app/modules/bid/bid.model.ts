import { model, Schema } from 'mongoose';
import { ENUM_BID_STATUS } from './bid.enum';
import { IBid } from './bid.interface';

const bidSchema = new Schema<IBid>(
    {
        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            required: true,
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        providerProposedAmount: {
            type: Number,
            default: null,
        },
        customerProposedAmount: {
            type: Number,
            default: null,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_BID_STATUS),
            default: ENUM_BID_STATUS.PENDING,
        },
    },
    { timestamps: true }
);

const BidModel = model<IBid>('Bid', bidSchema);
export default BidModel;
