"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField, TextInput } from "@/components/auth/FormField";
import {
  DEFAULT_RESTAURANT_SORT,
  restaurantQueryHref,
  RESTAURANT_SORT_OPTIONS,
  type RestaurantSort,
} from "@/lib/validations/restaurants";

type TypeOption = {
  value: string;
  label: string;
};

type RestaurantFiltersProps = {
  search: string;
  type: string;
  sort: RestaurantSort;
  typeOptions: TypeOption[];
  isActive: boolean;
};

const selectClassName =
  "h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";

export function RestaurantFilters({
  search,
  type,
  sort,
  typeOptions,
  isActive,
}: RestaurantFiltersProps) {
  const router = useRouter();

  const applyFromForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    router.push(
      restaurantQueryHref({
        search: String(data.get("search") ?? ""),
        type: String(data.get("type") ?? ""),
        sort: String(data.get("sort") ?? DEFAULT_RESTAURANT_SORT),
      }),
    );
  };

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        applyFromForm(event.currentTarget);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <FormField label="Search">
            <TextInput
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by name or description"
              autoComplete="off"
            />
          </FormField>
        </div>

        <FormField label="Restaurant type">
          <select
            name="type"
            defaultValue={type}
            className={selectClassName}
            onChange={(event) => {
              applyFromForm(event.currentTarget.form!);
            }}
          >
            <option value="">All types</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Sort">
          <select
            name="sort"
            defaultValue={sort}
            className={selectClassName}
            onChange={(event) => {
              applyFromForm(event.currentTarget.form!);
            }}
          >
            {RESTAURANT_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Search
        </button>
        {isActive ? (
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
