import { model, Schema } from 'mongoose';
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
    },
    { timestamps: true }
);

const BidModel = model<IBid>('Bid', bidSchema);
export default BidModel;
