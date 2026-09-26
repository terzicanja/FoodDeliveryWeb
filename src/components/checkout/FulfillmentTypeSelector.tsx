"use client";

import type { FulfillmentType } from "@prisma/client";
import { formatFulfillmentType } from "@/lib/format";

export type CheckoutFulfillmentType = FulfillmentType;

const FULFILLMENT_OPTIONS: Array<{
  value: CheckoutFulfillmentType;
  label: string;
  description: string;
}> = [
  {
    value: "DELIVERY",
    label: formatFulfillmentType("DELIVERY"),
    description: "A courier will bring the order to your address.",
  },
  {
    value: "PICKUP",
    label: formatFulfillmentType("PICKUP"),
    description: "Collect the order yourself at the restaurant. No courier is assigned.",
  },
];

type FulfillmentTypeSelectorProps = {
  value: CheckoutFulfillmentType;
  onChange: (value: CheckoutFulfillmentType) => void;
};

export function FulfillmentTypeSelector({
  value,
  onChange,
}: FulfillmentTypeSelectorProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Fulfillment
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Choose delivery or pickup for this order.
      </p>

      <fieldset className="mt-4 space-y-3">
        <legend className="sr-only">Choose fulfillment type</legend>
        {FULFILLMENT_OPTIONS.map((option) => {
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
                name="fulfillmentType"
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
