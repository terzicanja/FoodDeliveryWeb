export function RestaurantAccessDenied() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Access denied
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        You need a restaurant account to manage kitchen orders and meals.
      </p>
    </div>
  );
}
