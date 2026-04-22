import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ISubscriber } from './subscriber.interface';
import Subscriber from './subscriber.model';

const createSubscriber = async (payload: ISubscriber) => {
    const existingSubscriber = await Subscriber.findOne({
        email: payload.email,
    });
    if (existingSubscriber) {
        throw new AppError(
            httpStatus.CONFLICT,
            'Subscriber with this email already exists'
        );
    }
    return await Subscriber.create(payload);
};

const SubscriberServices = { createSubscriber };
export default SubscriberServices;
