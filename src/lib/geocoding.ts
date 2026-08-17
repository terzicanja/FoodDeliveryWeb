export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

type NominatimSearchResult = {
  lat?: string;
  lon?: string;
};

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_REVALIDATE_SECONDS = 60 * 60 * 24;
const GEOCODE_TIMEOUT_MS = 5000;

export function isValidCoordinates(
  coordinates: GeoCoordinates | null | undefined,
): coordinates is GeoCoordinates {
  if (!coordinates) {
    return false;
  }

  const { latitude, longitude } = coordinates;

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Geocode a street address with OpenStreetMap Nominatim.
 * Results are cached by Next.js fetch for 24 hours so the same
 * restaurant address is not requested on every page render.
 * Returns null when the address cannot be resolved.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeoCoordinates | null> {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "FoodDeliveryWeb/1.0 (university food-delivery project; restaurant location map)",
      },
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      next: { revalidate: GEOCODE_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.warn(
        `Nominatim geocoding failed with status ${response.status} for address: ${trimmed}`,
      );
      return null;
    }

    const results = (await response.json()) as NominatimSearchResult[];
    const match = Array.isArray(results) ? results[0] : undefined;

    if (!match?.lat || !match?.lon) {
      return null;
    }

    const coordinates = {
      latitude: Number(match.lat),
      longitude: Number(match.lon),
    };

    return isValidCoordinates(coordinates) ? coordinates : null;
  } catch (error) {
    console.warn("Nominatim geocoding failed:", error);
    return null;
  }
}
