import { Types } from 'mongoose';
import { ENUM_IDENTIFICATION_DOCUMENT } from '../customer/customer.enum';
import { ENUM_SERVICE_TYPE } from './provider.enum';

export interface IProvider {
    user: Types.ObjectId; // ref -> Users
    name: string;
    phone: string;
    email: string;
    profile_image?: string;
    city?: string;
    street?: string;
    identificationDocumentType?: (typeof ENUM_IDENTIFICATION_DOCUMENT)[keyof typeof ENUM_IDENTIFICATION_DOCUMENT];
    identificationDocumentNumber?: string;
    identification_document?: string;
    isVerified?: boolean;
    isIdentificationDocumentApproved?: boolean;
    referralCode?: string;
    address?: string;
    serviceTypes?: (typeof ENUM_SERVICE_TYPE)[keyof typeof ENUM_SERVICE_TYPE][];
    dateOfBirth?: Date;
    stripeAccountId?: string;
    isStripeConnected?: boolean;
}
