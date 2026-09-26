import "server-only";
import Stripe from "stripe";

function getStripeSecretKey(): string {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your .env file before using Stripe payments.",
    );
  }

  return secret;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Add it to your .env file before using Stripe webhooks.",
    );
  }

  return secret;
}

/**
 * Shared Stripe SDK client for server-side Checkout and webhooks.
 * Never import this module from client components.
 */
export const stripe = new Stripe(getStripeSecretKey());
