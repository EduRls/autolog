import { calculateDistanceMeters, isInsideGeofence } from './geofence.util';

describe('Geofence utilities', () => {
  it('calcula distancia cero para el mismo punto', () => {
    expect(calculateDistanceMeters(22.768056, -102.533056, 22.768056, -102.533056)).toBe(0);
  });

  it('calcula una distancia conocida con margen razonable', () => {
    const distance = calculateDistanceMeters(0, 0, 1, 0);
    expect(distance).toBeGreaterThan(111_000);
    expect(distance).toBeLessThan(111_300);
  });

  it('considera una posición dentro del radio', () => {
    expect(isInsideGeofence(
      { latitude: 22.7681, longitude: -102.5331 },
      { latitude: 22.768056, longitude: -102.533056, radioMetros: 150 },
    )).toBeTrue();
  });

  it('considera una posición fuera del radio', () => {
    expect(isInsideGeofence(
      { latitude: 22.78, longitude: -102.54 },
      { latitude: 22.768056, longitude: -102.533056, radioMetros: 150 },
    )).toBeFalse();
  });

  it('incluye exactamente el límite de la geocerca', () => {
    const position = { latitude: 22.769, longitude: -102.533056 };
    const distance = calculateDistanceMeters(22.768056, -102.533056, position.latitude, position.longitude);
    expect(isInsideGeofence(position, {
      latitude: 22.768056,
      longitude: -102.533056,
      radioMetros: distance,
    })).toBeTrue();
  });
});
