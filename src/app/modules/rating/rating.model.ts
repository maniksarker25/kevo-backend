import { model, Schema } from 'mongoose';
import { IRating } from './rating.interface';

const ratingSchema = new Schema<IRating>(
    {
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },

        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        details: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

const Rating = model<IRating>('Rating', ratingSchema);
export default Rating;
