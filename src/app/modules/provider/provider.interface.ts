import { Types } from 'mongoose';
import { ENUM_IDENTIFICATION_DOCUMENT } from '../customer/customer.enum';

export interface IProvider {
    user: Types.ObjectId; // ref -> Users
    name: string;
    phone: string;
    email: string;
    profile_image?: string;
    city?: string;
    street?: string;
    address_document?: string;
    identificationDocumentType?: (typeof ENUM_IDENTIFICATION_DOCUMENT)[keyof typeof ENUM_IDENTIFICATION_DOCUMENT];
    identificationDocumentNumber?: string;
    identification_document?: string;
    bankVerificationNumber?: string;
    isVerified?: boolean;
    isIdentificationDocumentApproved?: boolean;
    isBankVerificationNumberApproved?: boolean;
    isAddressProvided?: boolean;
    bankName?: string;
    bankAccountNumber?: string;
    referralCode?: string;
    address?: string;
}
