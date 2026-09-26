import { parseApiError } from "@/lib/api/auth-client";
import type { CreateOrderRequest } from "@/lib/api/orders-client";

export async function createStripeCheckoutRequest(payload: CreateOrderRequest) {
  const response = await fetch("/api/checkout/stripe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error:
        errorBody.error ?? "Could not start card checkout. Please try again.",
    };
  }

  const body = (await response.json()) as { url: string };

  return {
    ok: true as const,
    url: body.url,
  };
}
