import { model, Schema } from 'mongoose';
import { IQuestion } from './question.interface';

const questionSchema = new Schema<IQuestion>(
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
        details: {
            type: String,
            required: true,
        },
        question_image: {
            type: String, // optional
        },
    },
    { timestamps: true }
);

const QuestionModel = model<IQuestion>('Question', questionSchema);
export default QuestionModel;
