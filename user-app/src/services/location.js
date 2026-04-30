import * as Location from 'expo-location';

/**
 * Request foreground location permission and get current position.
 * @returns {{ lat: number, lng: number }} or null if denied
 */
export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    console.warn('[Location] Permission denied');
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
};

/**
 * Get human-readable address from lat/lng (reverse geocoding).
 */
export const reverseGeocode = async (lat, lng) => {
  const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
  if (results.length === 0) return null;

  const { street, city, region, postalCode } = results[0];
  return [street, city, region, postalCode].filter(Boolean).join(', ');
};

/**
 * Calculate straight-line distance between two coords (Haversine).
 * Returns distance in kilometres.
 */
export const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Format distance for display.
 */
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};
