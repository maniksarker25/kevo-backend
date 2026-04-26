import { model, Schema } from 'mongoose';
import { ENUM_IDENTIFICATION_DOCUMENT } from '../customer/customer.enum';
import { ENUM_SERVICE_TYPE } from '../task/task.enum';

const ProviderSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        profile_image: {
            type: String,
        },

        identificationDocumentType: {
            type: String,
            enum: Object.values(ENUM_IDENTIFICATION_DOCUMENT),
        },

        identificationDocumentNumber: {
            type: String,
        },

        identification_document: {
            type: String,
        },

        isIdentificationDocumentApproved: {
            type: Boolean,
            default: false,
        },

        address: {
            type: String,
        },

        serviceTypes: {
            type: [String],
            enum: Object.values(ENUM_SERVICE_TYPE),
            default: [],
        },

        dateOfBirth: {
            type: Date,
        },

        stripeAccountId: {
            type: String,
        },

        isStripeConnected: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const Provider = model('Provider', ProviderSchema);
