/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import { ENUM_IDENTIFICATION_DOCUMENT_TYPE } from '../provider/provider.enum';

export interface ICustomer {
    user: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    profile_image?: string;
    address?: string;
    referralCode?: string;
    dateOfBirth?: Date;
    stripeCustomerId?: string;
    identificationDocumentType?: (typeof ENUM_IDENTIFICATION_DOCUMENT_TYPE)[keyof typeof ENUM_IDENTIFICATION_DOCUMENT_TYPE];
    identificationDocumentNumber?: string;
    identification_document?: string;
    isIdentificationDocumentApproved?: boolean;
}
