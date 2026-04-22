import { model, Schema } from 'mongoose';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import {
    ENUM_DONE_BY,
    ENUM_SCHEDULE_TYPE,
    ENUM_TASK_STATUS,
} from './task.enum';
import { IStatusWithDate, ITask } from './task.interface';

const statusWithDateSchema = new Schema<IStatusWithDate>({
    status: {
        type: String,
        enum: Object.values(ENUM_TASK_STATUS),
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
});

const taskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        service: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            default: null,
        },

        budget: { type: Number, required: true },
        acceptedBidAmount: { type: Number, default: null },
        customerPayingAmount: { type: Number, default: null },
        providerEarningAmount: { type: Number, default: null },
        status: {
            type: String,
            enum: Object.values(ENUM_TASK_STATUS),
            default: ENUM_TASK_STATUS.OPEN_FOR_BID,
        },

        isDeleted: { type: Boolean, default: false },

        paymentStatus: {
            type: String,
            enum: Object.values(ENUM_PAYMENT_STATUS),
            default: ENUM_PAYMENT_STATUS.UNPAID,
        },

        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            default: null,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
        },

        payOn: { type: String },
        doneBy: {
            type: String,
            enum: Object.values(ENUM_DONE_BY),
            required: true,
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                // required: true,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                //  required: true,
                index: '2dsphere',
            },
        },
        address: {
            type: String,
            default: '',
        },
        city: {
            type: String,
            default: '',
        },
        scheduleType: {
            type: String,
            enum: Object.values(ENUM_SCHEDULE_TYPE),
        },
        preferredDeliveryDateTime: { type: Date, default: null },
        description: { type: String, required: true },
        task_attachments: [{ type: String }],
        statusWithDate: {
            type: [statusWithDateSchema],
        },
        transactionId: { type: String, default: null },
        paymentReferenceId: { type: String, default: null },
    },

    { timestamps: true }
);

const TaskModel = model<ITask>('Task', taskSchema);
export default TaskModel;
