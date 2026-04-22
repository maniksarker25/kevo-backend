/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import config from '../config';
import { Request, Response } from 'express';
import updateStripeConnectedAccountStatus from './updateStripeAccountConnectedStatus';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);
const handleConnectedAccountWebhook = async (req: Request, res: Response) => {
  const endpointSecret = config.stripe.connected_account_webhook_secret;
  const sig = req.headers['stripe-signature'];

  try {
    // Verify the event
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret as string,
    );

    // Handle different event types
    switch (event.type) {
      case 'account.updated': {
        console.log('web hook account update');
        const account = event.data.object as Stripe.Account;
        // console.log('acount', account);
        if (account.details_submitted) {
          try {
            // console.log('details submited');
            await updateStripeConnectedAccountStatus(account.id);
          } catch (err) {
            console.error(
              `Failed to update client status for Stripe account ID: ${account.id}`,
              err,
            );
          }
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send('Success');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export default handleConnectedAccountWebhook;
