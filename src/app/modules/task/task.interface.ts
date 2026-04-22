import { Types } from 'mongoose';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import { ENUM_SERVICE_TYPE } from '../provider/provider.enum';
import { ENUM_TASK_STATUS } from './task.enum';

export interface IStatusWithDate {
    status: (typeof ENUM_TASK_STATUS)[keyof typeof ENUM_TASK_STATUS];
    date: Date;
}

export interface ITask {
    title: string;
    serviceType: (typeof ENUM_SERVICE_TYPE)[keyof typeof ENUM_SERVICE_TYPE];
    budget: number;
    taskStartDateTime: Date | null;
    acceptedBidAmount: number;
    customerPayingAmount: number;
    providerEarningAmount: number;
    status: (typeof ENUM_TASK_STATUS)[keyof typeof ENUM_TASK_STATUS];
    paymentStatus: (typeof ENUM_PAYMENT_STATUS)[keyof typeof ENUM_PAYMENT_STATUS];
    provider?: Types.ObjectId | null;
    customer: Types.ObjectId;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    address: string;
    city?: string;
    preferredDeliveryDateTime?: Date | null;
    description: string;
    task_attachments: string[];
    statusWithDate: IStatusWithDate[];
    transactionId?: string;
    deletedImages: string[];
    isDeleted: boolean;
}
