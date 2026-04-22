import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../error/appError';
import { Provider } from '../provider/provider.model';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const createConnectedAccountAndOnboardingLink = async (
    userData: JwtPayload,
    profileId: string
) => {
    const provider = await Provider.findById(profileId);
    if (!provider) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (provider.stripeAccountId) {
        const onboardingLink = await stripe.accountLinks.create({
            account: provider.stripeAccountId,
            refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${provider.stripeAccountId}`,
            return_url: config.stripe.onboarding_return_url,
            type: 'account_onboarding',
        });
        return onboardingLink.url;
    }

    //  Create a connected account
    const account = await stripe.accounts.create({
        type: 'express',
        email: provider.email,
        country: 'US',
        capabilities: {
            // card_payments: { requested: true },
            transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
            payouts: {
                schedule: {
                    interval: 'manual',
                },
            },
        },
    });

    const updatedProvider = await Provider.findByIdAndUpdate(
        profileId,
        { stripeAccountId: account.id },
        { new: true, runValidators: true }
    );

    if (!updatedProvider) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Server temporarily unavailable'
        );
    }

    const onboardingLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${account?.id}`,
        return_url: config.stripe.onboarding_return_url,
        type: 'account_onboarding',
    });
    return onboardingLink.url;
};

const updateOnboardingLink = async (profileId: string) => {
    const provider = await Provider.findById(profileId);
    const stripAccountId = provider?.stripeAccountId;
    const accountLink = await stripe.accountLinks.create({
        account: stripAccountId as string,
        refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${stripAccountId}`,
        return_url: config.stripe.onboarding_return_url,
        type: 'account_onboarding',
    });

    return { link: accountLink.url };
};

const StripeService = {
    createConnectedAccountAndOnboardingLink,
    updateOnboardingLink,
};

export default StripeService;
