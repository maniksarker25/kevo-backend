import { model, Schema } from 'mongoose';
import { ISentOffer } from './sentOffer.interface';

const sentOfferSchema = new Schema<ISentOffer>(
    {
        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            required: true,
        },
        service: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
    },
    { timestamps: true }
);

const SentOfferModel = model<ISentOffer>('SentOffer', sentOfferSchema);
export default SentOfferModel;
