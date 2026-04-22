import { model, Schema } from 'mongoose';
import { INotification } from './notification.interface';
import { ENUM_NOTIFICATION_TYPE } from './notification.enum';

const notificationSchema = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        receiver: {
            type: String,
            required: true,
        },
        deleteBy: {
            type: [String],
            default: [],
        },
        seenBy: {
            type: [String],
            default: [],
        },
        redirectLink: {
            type: String, // e.g. /task/123 or /provider/profile
            default: '',
        },
        type: {
            type: String,
            enum: Object.values(ENUM_NOTIFICATION_TYPE),
            default: ENUM_NOTIFICATION_TYPE.GENERAL,
        },
    },
    //-------------------------
    {
        timestamps: true,
    }
);

const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;
