import { ENUM_NOTIFICATION_TYPE } from './notification.enum';

export interface INotification {
    title: string;
    message: string;
    receiver: string;
    deleteBy: string[];
    redirectLink: string;
    seenBy: string[];
    type: ENUM_NOTIFICATION_TYPE;
}
