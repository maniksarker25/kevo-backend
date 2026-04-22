import { Types } from 'mongoose';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import {
    ENUM_DONE_BY,
    ENUM_SCHEDULE_TYPE,
    ENUM_TASK_STATUS,
} from './task.enum';

export interface IStatusWithDate {
    status: (typeof ENUM_TASK_STATUS)[keyof typeof ENUM_TASK_STATUS];
    date: Date;
}

export interface ITask {
    title: string;
    category: Types.ObjectId;
    service: Types.ObjectId | null;
    budget: number;
    acceptedBidAmount: number;
    customerPayingAmount: number;
    providerEarningAmount: number;
    status: (typeof ENUM_TASK_STATUS)[keyof typeof ENUM_TASK_STATUS];
    isDeleted: boolean;
    paymentStatus: (typeof ENUM_PAYMENT_STATUS)[keyof typeof ENUM_PAYMENT_STATUS];
    provider?: Types.ObjectId | null;
    customer: Types.ObjectId;
    payOn: string;
    doneBy: (typeof ENUM_DONE_BY)[keyof typeof ENUM_DONE_BY];
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    address: string;
    city: string;
    scheduleType: (typeof ENUM_SCHEDULE_TYPE)[keyof typeof ENUM_SCHEDULE_TYPE];
    preferredDeliveryDateTime?: Date | null;
    description: string;
    task_attachments: string[];
    statusWithDate: IStatusWithDate[];
    transactionId?: string;
    paymentReferenceId?: string;
    deletedImages: string[];
}
