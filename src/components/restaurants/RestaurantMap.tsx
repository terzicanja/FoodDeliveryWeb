"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const RestaurantLeafletMap = dynamic(
  () =>
    import("@/components/restaurants/RestaurantLeafletMap").then(
      (mod) => mod.RestaurantLeafletMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center bg-zinc-50 text-sm text-zinc-500 sm:h-64">
        Loading map...
      </div>
    ),
  },
);

type RestaurantMapProps = {
  name: string;
  latitude: number;
  longitude: number;
};

function hasValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function RestaurantMap({
  name,
  latitude,
  longitude,
}: RestaurantMapProps) {
  if (!hasValidCoordinates(latitude, longitude)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 text-center text-sm text-zinc-500 sm:h-64">
        Location unavailable
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className="relative z-0 h-48 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:h-64">
        <RestaurantLeafletMap
          name={name}
          latitude={latitude}
          longitude={longitude}
        />
      </div>
    </MapErrorBoundary>
  );
}

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 text-center text-sm text-zinc-500 sm:h-64">
          Location unavailable
        </div>
      );
    }

    return this.props.children;
  }
}
