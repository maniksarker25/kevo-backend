import { model, Schema } from 'mongoose';
import { ENUM_SERVICE_STATUS } from './service.enum';
import { IService } from './service.interface';

const serviceSchema = new Schema<IService>(
    {
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        title: { type: String, required: true },
        images: [{ type: String }],

        provider: {
            type: Schema.Types.ObjectId,
            ref: 'Provider',
            required: true,
        },

        description: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        price: { type: Number, required: true },

        status: {
            type: String,
            enum: Object.values(ENUM_SERVICE_STATUS),
            default: ENUM_SERVICE_STATUS.ACTIVE,
        },
    },
    { timestamps: true }
);

const ServiceModel = model<IService>('Service', serviceSchema);
export default ServiceModel;
