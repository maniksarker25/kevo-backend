import { model, Schema } from 'mongoose';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import { ENUM_SERVICE_TYPE, ENUM_TASK_STATUS } from './task.enum';
import { ITask } from './task.interface';

const taskSchema = new Schema<ITask>(
    {
        title: { type: String, required: false, default: '' },
        serviceType: {
            type: String,
            enum: Object.values(ENUM_SERVICE_TYPE),
            required: true,
        },

        budget: { type: Number, required: true },
        taskStartDateTime: { type: Date, default: null },
        acceptedBidAmount: { type: Number, default: null },
        customerPayingAmount: { type: Number, default: null },
        providerEarningAmount: { type: Number, default: null },
        status: {
            type: String,
            enum: Object.values(ENUM_TASK_STATUS),
            default: ENUM_TASK_STATUS.OPEN,
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
        description: { type: String, required: true },
        task_attachments: [{ type: String }],
        imagesAfterCompletion: {
            type: [String],
            default: [],
        },
        isMarkCompletedByProvider: {
            type: Boolean,
            default: false,
        },
        markCompletedByProviderAt: {
            type: Date,
            default: null,
        },

        transactionId: { type: String, default: null },
    },

    { timestamps: true }
);

const TaskModel = model<ITask>('Task', taskSchema);
export default TaskModel;
