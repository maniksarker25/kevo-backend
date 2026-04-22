import { model, Schema } from 'mongoose';
import { ISubscriber } from './subscriber.interface';

const subscriberSchema = new Schema<ISubscriber>(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: ['Provider', 'Customer'],
            required: true,
        },
    },
    { timestamps: true }
);

const Subscriber = model<ISubscriber>('Subscriber', subscriberSchema);
export default Subscriber;
