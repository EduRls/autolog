export interface GeographicPosition {
  latitude: number;
  longitude: number;
}

export interface CircularGeofence extends GeographicPosition {
  radioMetros: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

export function calculateDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const originLatitude = toRadians(latitudeA);
  const destinationLatitude = toRadians(latitudeB);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function isInsideGeofence(
  position: GeographicPosition,
  point: CircularGeofence,
): boolean {
  return calculateDistanceMeters(
    position.latitude,
    position.longitude,
    point.latitude,
    point.longitude,
  ) <= point.radioMetros;
}
