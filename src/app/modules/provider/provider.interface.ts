import { Types } from 'mongoose';
import { ENUM_IDENTIFICATION_DOCUMENT } from '../customer/customer.enum';
import { ENUM_SERVICE_TYPE } from '../task/task.enum';
type ServiceType = (typeof ENUM_SERVICE_TYPE)[keyof typeof ENUM_SERVICE_TYPE];

export interface IProvider {
    user: Types.ObjectId;
    name: string;
    phone: string;
    email: string;
    profile_image?: string;
    identificationDocumentType?: (typeof ENUM_IDENTIFICATION_DOCUMENT)[keyof typeof ENUM_IDENTIFICATION_DOCUMENT];
    identificationDocumentNumber?: string;
    identification_document?: string;
    isIdentificationDocumentApproved?: boolean;
    address?: string;
    serviceTypes?: ServiceType[];
    dateOfBirth?: Date;
    stripeAccountId?: string;
    isStripeConnected?: boolean;
}
