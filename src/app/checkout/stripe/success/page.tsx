import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { ClearCartOnPaidOrder } from "@/components/checkout/ClearCartOnPaidOrder";
import { StripeCheckoutReturnCard } from "@/components/checkout/StripeCheckoutReturnCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OrderSuccessView } from "@/components/orders/OrderSuccessView";
import { getAuthPayload } from "@/lib/auth-request";
import { confirmStripeCheckoutSuccess } from "@/lib/stripe-success";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Received | FoodDelivery",
  description: "Your card payment was received.",
};

type StripeCheckoutSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
};

function readSessionId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export default async function StripeCheckoutSuccessPage({
  searchParams,
}: StripeCheckoutSuccessPageProps) {
  const params = await searchParams;
  const sessionId = readSessionId(params.session_id);
  const auth = await getAuthPayload();

  if (!sessionId) {
    return (
      <StripeSuccessLayout>
        <StripeCheckoutReturnCard
          title="Missing payment session"
          message="We could not confirm this payment because the checkout session is missing. Return to checkout to try again. Your cart was not cleared."
          primaryHref="/checkout"
          primaryLabel="Return to checkout"
          secondaryHref="/"
          secondaryLabel="Back to home"
        />
      </StripeSuccessLayout>
    );
  }

  if (!auth) {
    redirect(
      `/login?next=${encodeURIComponent(`/checkout/stripe/success?session_id=${sessionId}`)}`,
    );
  }

  if (auth.role !== Role.CUSTOMER) {
    return (
      <StripeSuccessLayout>
        <StripeCheckoutReturnCard
          title="Unable to show this order"
          message="This payment confirmation is only available to the customer who placed it."
          primaryHref="/"
          primaryLabel="Back to home"
        />
      </StripeSuccessLayout>
    );
  }

  const result = await confirmStripeCheckoutSuccess({
    sessionId,
    userId: auth.userId,
  });

  if (result.status === "confirmed") {
    return (
      <StripeSuccessLayout>
        <ClearCartOnPaidOrder />
        <OrderSuccessView
          orderId={String(result.order.id)}
          status={result.order.status}
          totalPrice={String(result.order.totalPrice)}
        />
      </StripeSuccessLayout>
    );
  }

  return (
    <StripeSuccessLayout>
      <StripeCheckoutReturnCard {...returnCardForResult(result.status)} />
    </StripeSuccessLayout>
  );
}

function StripeSuccessLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}

function returnCardForResult(
  status: Exclude<
    Awaited<ReturnType<typeof confirmStripeCheckoutSuccess>>["status"],
    "confirmed"
  >,
) {
  switch (status) {
    case "invalid_session":
      return {
        title: "Payment session not found",
        message:
          "We could not find that Stripe checkout session. Your cart was not cleared.",
        primaryHref: "/checkout",
        primaryLabel: "Return to checkout",
        secondaryHref: "/",
        secondaryLabel: "Back to home",
      };
    case "unpaid":
      return {
        title: "Payment not completed",
        message:
          "This Stripe checkout session is not paid. No order is shown and your cart was not cleared.",
        primaryHref: "/checkout",
        primaryLabel: "Return to checkout",
        secondaryHref: "/",
        secondaryLabel: "Back to home",
      };
    case "pending_order":
      return {
        title: "Payment received",
        message:
          "Your card payment was received. Your order is still being finalized and is not available yet. Check My Orders in a moment. Your cart was not cleared.",
        primaryHref: "/orders",
        primaryLabel: "My Orders",
        secondaryHref: "/",
        secondaryLabel: "Back to home",
      };
    case "unavailable":
      return {
        title: "Unable to show this order",
        message:
          "We could not show an order for this payment. Your cart was not cleared.",
        primaryHref: "/",
        primaryLabel: "Back to home",
        secondaryHref: "/orders",
        secondaryLabel: "My Orders",
      };
    case "error":
      return {
        title: "Something went wrong",
        message:
          "We could not confirm this payment right now. Check My Orders or return to checkout. Your cart was not cleared.",
        primaryHref: "/orders",
        primaryLabel: "My Orders",
        secondaryHref: "/checkout",
        secondaryLabel: "Return to checkout",
      };
  }
}
