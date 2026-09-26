"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormField, TextInput } from "@/components/auth/FormField";
import {
  DEFAULT_RESTAURANT_SORT,
  DISTANCE_SORT,
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
  lat?: number;
  lng?: number;
  typeOptions: TypeOption[];
  isActive: boolean;
};

const selectClassName =
  "h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";

type LocationStatus = "idle" | "locating" | "denied" | "unavailable";

function readFormValues(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    search: String(data.get("search") ?? ""),
    type: String(data.get("type") ?? ""),
    sort: String(data.get("sort") ?? DEFAULT_RESTAURANT_SORT),
  };
}

export function RestaurantFilters({
  search,
  type,
  sort,
  lat,
  lng,
  typeOptions,
  isActive,
}: RestaurantFiltersProps) {
  const router = useRouter();
  const sortSelectRef = useRef<HTMLSelectElement>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    sort === DISTANCE_SORT && (lat == null || lng == null)
      ? "unavailable"
      : "idle",
  );
  const [locationMessage, setLocationMessage] = useState<string | null>(
    sort === DISTANCE_SORT && (lat == null || lng == null)
      ? "Location is needed for Near Me. Allow location access or choose another sort."
      : null,
  );

  const navigate = (values: {
    search: string;
    type: string;
    sort: string;
    lat?: number | null;
    lng?: number | null;
  }) => {
    router.push(
      restaurantQueryHref({
        search: values.search,
        type: values.type,
        sort: values.sort,
        lat: values.lat,
        lng: values.lng,
      }),
    );
  };

  const applyWithCurrentLocation = (
    form: HTMLFormElement,
    nextSort: string,
  ) => {
    const values = readFormValues(form);

    if (nextSort !== DISTANCE_SORT) {
      setLocationStatus("idle");
      setLocationMessage(null);
      navigate({
        search: values.search,
        type: values.type,
        sort: nextSort,
      });
      return;
    }

    if (lat != null && lng != null) {
      setLocationStatus("idle");
      setLocationMessage(null);
      navigate({
        search: values.search,
        type: values.type,
        sort: DISTANCE_SORT,
        lat,
        lng,
      });
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      setLocationMessage(
        "Location is not supported in this browser. Choose another sort option.",
      );
      if (sortSelectRef.current) {
        sortSelectRef.current.value = sort === DISTANCE_SORT ? DEFAULT_RESTAURANT_SORT : sort;
      }
      return;
    }

    setLocationStatus("locating");
    setLocationMessage("Getting your location…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("idle");
        setLocationMessage(null);
        navigate({
          search: values.search,
          type: values.type,
          sort: DISTANCE_SORT,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setLocationStatus(denied ? "denied" : "unavailable");
        setLocationMessage(
          denied
            ? "Location permission was denied. You can still browse restaurants with another sort."
            : "Could not get your location. You can still browse restaurants with another sort.",
        );
        if (sortSelectRef.current) {
          sortSelectRef.current.value =
            sort === DISTANCE_SORT ? DEFAULT_RESTAURANT_SORT : sort;
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60_000,
      },
    );
  };

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const values = readFormValues(event.currentTarget);
        applyWithCurrentLocation(event.currentTarget, values.sort);
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
              applyWithCurrentLocation(
                event.currentTarget.form!,
                String(new FormData(event.currentTarget.form!).get("sort") ?? DEFAULT_RESTAURANT_SORT),
              );
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
            ref={sortSelectRef}
            name="sort"
            defaultValue={sort}
            disabled={locationStatus === "locating"}
            className={selectClassName}
            onChange={(event) => {
              applyWithCurrentLocation(
                event.currentTarget.form!,
                event.currentTarget.value,
              );
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

      {locationMessage ? (
        <p
          role="status"
          className={`mt-3 text-sm ${
            locationStatus === "locating"
              ? "text-zinc-500"
              : "text-amber-800"
          }`}
        >
          {locationMessage}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={locationStatus === "locating"}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locationStatus === "locating" ? "Locating…" : "Search"}
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
