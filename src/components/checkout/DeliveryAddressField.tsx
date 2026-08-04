"use client";

type DeliveryAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
};

export function DeliveryAddressField({
  value,
  onChange,
  error,
  disabled = false,
}: DeliveryAddressFieldProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Delivery address
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Pre-filled from your profile. Changes apply to this order only.
      </p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          Address
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Street, number, city"
          className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 ${
            error ? "border-red-400" : "border-zinc-300"
          }`}
        />
      </label>

      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
