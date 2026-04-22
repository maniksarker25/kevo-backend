/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

export interface ICustomer {
    user: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    profile_image?: string;
    city?: string;
    street?: string;
    address?: string;
    referralCode?: string;
}
