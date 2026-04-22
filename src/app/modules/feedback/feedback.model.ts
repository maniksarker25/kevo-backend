import { model, Schema } from 'mongoose';
import { IFeedback } from './feedback.interface';

const feedbackSchema = new Schema<IFeedback>(
    {
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        service: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            default: null,
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
            required: true,
        },
    },
    { timestamps: true }
);

const FeedbackModel = model<IFeedback>('Feedback', feedbackSchema);
export default FeedbackModel;
