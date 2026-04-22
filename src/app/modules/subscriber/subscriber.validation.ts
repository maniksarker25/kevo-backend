import { z } from 'zod';

export const createSubscriber = z.object({
    body: z.object({
        email: z.string({ required_error: 'Email is required' }).email(),
        phone: z.string({ required_error: 'Phone is required' }),
    }),
});

const SubscriberValidations = { createSubscriber };
export default SubscriberValidations;
