import { Types } from 'mongoose';

export interface IQuestion {
    provider: Types.ObjectId; // ref -> Provider
    task: Types.ObjectId; // ref -> Task
    details: string;
    question_image?: string; // optional single image or image URL
}
