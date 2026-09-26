import Link from "next/link";

type StripeCheckoutReturnCardProps = {
  title: string;
  message: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function StripeCheckoutReturnCard({
  title,
  message,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: StripeCheckoutReturnCardProps) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">{message}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={primaryHref}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
