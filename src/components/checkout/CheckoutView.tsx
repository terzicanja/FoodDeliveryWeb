"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { DeliveryAddressField } from "@/components/checkout/DeliveryAddressField";
import {
  PaymentMethodSelector,
  type CheckoutPaymentMethod,
} from "@/components/checkout/PaymentMethodSelector";
import { useCart } from "@/context/CartProvider";
import { fetchCurrentUser } from "@/lib/api/auth-client";
import {
  buildOrderSuccessHref,
  createOrderRequest,
} from "@/lib/api/orders-client";
import type { PublicUser } from "@/lib/user";

type CheckoutStatus = "loading" | "ready" | "unauthenticated";

export function CheckoutView() {
  const router = useRouter();
  const { items, isReady: isCartReady, clearCart } = useCart();

  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("CASH");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const response = await fetchCurrentUser();

      if (cancelled) {
        return;
      }

      if (response.status === 401) {
        setStatus("unauthenticated");
        router.replace("/login?next=/checkout");
        return;
      }

      if (!response.ok) {
        setFormError("Could not load your profile. Please try again.");
        setStatus("ready");
        return;
      }

      const body = (await response.json()) as { user: PublicUser };
      setUser(body.user);
      setDeliveryAddress(body.user.address);
      setStatus("ready");
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handlePlaceOrder = async () => {
    if (isSubmitting) {
      return;
    }

    setAddressError(null);
    setFormError(null);

    if (!isCartReady || items.length === 0) {
      setFormError("Your cart is empty. Add meals before placing an order.");
      return;
    }

    const trimmedAddress = deliveryAddress.trim();

    if (!trimmedAddress) {
      setAddressError("Delivery address is required.");
      return;
    }

    if (!user) {
      setFormError("Could not load your profile. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOrderRequest({
        deliveryAddress: trimmedAddress,
        paymentMethod,
        items: items.map((item) => ({
          mealId: String(item.mealId),
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        if (result.status === 401) {
          router.replace("/login?next=/checkout");
          return;
        }

        setFormError(result.error);
        return;
      }

      clearCart();
      router.push(buildOrderSuccessHref(result.order));
    } catch {
      setFormError("Could not place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated" || !isCartReady) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading checkout..."}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Nothing to check out
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Your cart is empty. Add meals before proceeding to checkout.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Review your order details before placing it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <DeliveryAddressField
            value={deliveryAddress}
            onChange={setDeliveryAddress}
            error={addressError}
            disabled={isSubmitting}
          />

          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <CheckoutOrderSummary />

          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handlePlaceOrder();
            }}
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Placing order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
