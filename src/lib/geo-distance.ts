import type { GeoCoordinates } from "@/lib/geocoding";

/**
 * Earth radius in kilometers (mean). Used by Haversine distance.
 */
export const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance in kilometers between two WGS84 points.
 * Returns null when either point is missing or invalid.
 */
export function haversineDistanceKm(
  from: GeoCoordinates,
  to: GeoCoordinates,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }

  const rounded =
    distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm).toString();

  return `${rounded} km away`;
}
