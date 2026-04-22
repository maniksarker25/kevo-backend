import { model, Schema } from 'mongoose';
import { ENUM_PAYMENT_STATUS } from '../../utilities/enum';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
    {
        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            // required: true,
            default: null,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            // required: true,
            default: null,
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        amount: {
            type: Number,
            // required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_PAYMENT_STATUS),
            default: ENUM_PAYMENT_STATUS.UNPAID,
        },
        customerPayingAmount: {
            type: Number,
            required: true,
        },
        platformEarningAmount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);
paymentSchema.index({ provider: 1, status: 1, updatedAt: -1 });

const Payment = model<IPayment>('Payment', paymentSchema);
export default Payment;
