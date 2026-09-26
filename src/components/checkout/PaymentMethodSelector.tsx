"use client";

import type { PaymentMethod } from "@prisma/client";
import { formatPaymentMethod } from "@/lib/format";

export type CheckoutPaymentMethod = PaymentMethod;

const PAYMENT_OPTIONS: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  description: string;
}> = [
  {
    value: "CASH_ON_DELIVERY",
    label: formatPaymentMethod("CASH_ON_DELIVERY"),
    description: "Pay cash to the courier when your order arrives.",
  },
  {
    value: "CARD_ON_DELIVERY",
    label: formatPaymentMethod("CARD_ON_DELIVERY"),
    description: "Pay by card to the courier when your order arrives.",
  },
  {
    value: "CARD",
    label: formatPaymentMethod("CARD"),
    description: "Pay securely by card on Stripe's checkout page.",
  },
];

type PaymentMethodSelectorProps = {
  value: CheckoutPaymentMethod;
  onChange: (value: CheckoutPaymentMethod) => void;
};

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Payment method
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Choose how you want to pay for this order.
      </p>

      <fieldset className="mt-4 space-y-3">
        <legend className="sr-only">Choose a payment method</legend>
        {PAYMENT_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                selected
                  ? "border-orange-400 bg-orange-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 accent-orange-600"
              />
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {option.label}
                </span>
                <span className="mt-1 block text-sm text-zinc-500">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
