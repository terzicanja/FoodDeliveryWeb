import { RestaurantMap } from "@/components/restaurants/RestaurantMap";
import {
  isValidCoordinates,
  type GeoCoordinates,
} from "@/lib/geocoding";

type RestaurantLocationProps = {
  name: string;
  address: string;
  coordinates: GeoCoordinates | null;
};

export function RestaurantLocation({
  name,
  address,
  coordinates,
}: RestaurantLocationProps) {
  return (
    <section className="mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Lokacija restorana
        </h2>
        <p className="mt-2 text-sm text-zinc-500">{address}</p>
      </div>

      {isValidCoordinates(coordinates) ? (
        <RestaurantMap
          name={name}
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 text-center sm:h-64">
          <p className="text-sm text-zinc-500">Location unavailable</p>
        </div>
      )}
    </section>
  );
}
