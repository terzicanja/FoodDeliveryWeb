"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { DeliveryAddressField } from "@/components/checkout/DeliveryAddressField";
import {
  FulfillmentTypeSelector,
  type CheckoutFulfillmentType,
} from "@/components/checkout/FulfillmentTypeSelector";
import {
  PaymentMethodSelector,
  type CheckoutPaymentMethod,
} from "@/components/checkout/PaymentMethodSelector";
import { useCart } from "@/context/CartProvider";
import { fetchCurrentUser } from "@/lib/api/auth-client";
import { createStripeCheckoutRequest } from "@/lib/api/checkout-client";
import {
  buildOrderSuccessHref,
  createOrderRequest,
} from "@/lib/api/orders-client";
import { getCartRestaurantId } from "@/lib/cart";
import type { PublicUser } from "@/lib/user";
import { ORDER_NOTE_MAX_LENGTH } from "@/lib/validations/orders";

type CheckoutStatus = "loading" | "ready" | "unauthenticated";

export function CheckoutView() {
  const router = useRouter();
  const { items, isReady: isCartReady, clearCart } = useCart();

  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [fulfillmentType, setFulfillmentType] =
    useState<CheckoutFulfillmentType>("DELIVERY");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("CASH_ON_DELIVERY");
  const [note, setNote] = useState("");
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

    const restaurantId = getCartRestaurantId(items);

    if (restaurantId === null) {
      setFormError("Your cart is empty. Add meals before placing an order.");
      return;
    }

    const trimmedAddress = deliveryAddress.trim();

    if (!trimmedAddress) {
      setAddressError(
        fulfillmentType === "PICKUP"
          ? "Contact address is required."
          : "Delivery address is required.",
      );
      return;
    }

    if (!user) {
      setFormError("Could not load your profile. Please try again.");
      return;
    }

    setIsSubmitting(true);

    const checkoutPayload = {
      restaurantId,
      deliveryAddress: trimmedAddress,
      fulfillmentType,
      paymentMethod,
      note: note.trim() ? note.trim() : null,
      items: items.map((item) => ({
        mealId: String(item.mealId),
        quantity: item.quantity,
      })),
    };

    try {
      if (paymentMethod === "CARD") {
        const result = await createStripeCheckoutRequest(checkoutPayload);

        if (!result.ok) {
          if (result.status === 401) {
            router.replace("/login?next=/checkout");
            return;
          }

          setFormError(result.error);
          return;
        }

        if (!result.url) {
          setFormError("Could not start card checkout. Please try again.");
          return;
        }

        window.location.assign(result.url);
        return;
      }

      const result = await createOrderRequest(checkoutPayload);

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
      setFormError(
        paymentMethod === "CARD"
          ? "Could not start card checkout. Please try again."
          : "Could not place your order. Please try again.",
      );
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
          <FulfillmentTypeSelector
            value={fulfillmentType}
            onChange={setFulfillmentType}
          />

          <DeliveryAddressField
            value={deliveryAddress}
            onChange={setDeliveryAddress}
            error={addressError}
            disabled={isSubmitting}
            fulfillmentType={fulfillmentType}
          />

          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
          />

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Order note
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Optional instructions for the restaurant or courier.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                Note
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                maxLength={ORDER_NOTE_MAX_LENGTH}
                placeholder='e.g. "Bez luka" or "Pozvoniti na interfon"'
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50"
              />
            </label>
            <p className="mt-1.5 text-xs text-zinc-400">
              {note.trim().length}/{ORDER_NOTE_MAX_LENGTH}
            </p>
          </section>
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
            {isSubmitting
              ? paymentMethod === "CARD"
                ? "Continuing to payment..."
                : "Placing order..."
              : paymentMethod === "CARD"
                ? "Continue to payment"
                : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
