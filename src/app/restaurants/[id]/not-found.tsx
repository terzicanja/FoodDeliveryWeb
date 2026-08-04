import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col items-start px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Restaurant not found
        </h1>
        <p className="mt-3 max-w-lg text-zinc-600">
          This restaurant doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Browse restaurants
        </Link>
      </main>
    </div>
  );
}
