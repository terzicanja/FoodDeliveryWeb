import { NextResponse } from "next/server";
import { getStripeWebhookSecret, stripe } from "@/lib/stripe";
import {
  handleStripeWebhookEvent,
  StripeWebhookError,
} from "@/lib/stripe-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("POST /api/webhooks/stripe missing signature header");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = await request.text();

  let webhookSecret: string;

  try {
    webhookSecret = getStripeWebhookSecret();
  } catch {
    console.error("POST /api/webhooks/stripe webhook secret is not configured");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    console.error("POST /api/webhooks/stripe invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    if (error instanceof StripeWebhookError) {
      return NextResponse.json(
        { error: "Webhook handler failed" },
        { status: error.statusCode },
      );
    }

    console.error("POST /api/webhooks/stripe failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
