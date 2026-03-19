import { MercatorCoordinate } from 'maplibre-gl';
import { Euler, Vector3 } from 'three';

/**
 * World projection math for MapLibre & Three.js alignment.
 */
export const WGS84_TO_MERCATOR = (
  lng: number,
  lat: number,
  alt: number = 0
) => {
  const coord = MercatorCoordinate.fromLngLat([lng, lat], alt);
  return {
    x: coord.x,
    y: coord.y,
    z: coord.z || 0,
    meterScale: coord.meterInMercatorCoordinateUnits(),
  };
};

/**
 * Calculate position in METERS relative to centerCoord.
 * Returns a Vector3 where Y is UP (altitude).
 */
export const getRelativePosition = (
  lng: number,
  lat: number,
  alt: number,
  center: { x: number; y: number; z: number; meterScale: number }
) => {
  const coord = WGS84_TO_MERCATOR(lng, lat, alt);

  // Note: Three.js uses Y-up. MapLibre uses Z-up.
  // We map MapLibre's Z (altitude) to Three.js's Y.
  return new Vector3(
    (coord.x - center.x) / center.meterScale,
    (coord.z - center.z) / center.meterScale, // Z altitude -> Y up
    (coord.y - center.y) / center.meterScale // Y latitude -> Z depth
  );
};

/**
 * Check if a coordinate is within given bounds.
 */
export const isWithinBounds = (
  lng: number,
  lat: number,
  bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }
) => {
  return (
    lng >= bounds.minLng &&
    lng <= bounds.maxLng &&
    lat >= bounds.minLat &&
    lat <= bounds.maxLat
  );
};

/**
 * Calculate Euler rotation based on MapLibre yaw/pitch/roll.
 */
export const getRelativeRotation = (
  yaw: number = 0,
  pitch: number = 0,
  roll: number = 0
) => {
  const yawRad = (yaw * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;
  const rollRad = (roll * Math.PI) / 180;

  // Trong không gian chuẩn Three.js (Y-up):
  // - Xoay quanh trục Y = Heading/Yaw (âm để khớp với MapLibre)
  // - Xoay quanh trục X = Pitch
  // - Xoay quanh trục Z = Roll
  return new Euler(
    pitchRad, // Trục X: Dựng đứng model + Pitch
    Math.PI / 2 + rollRad, // Trục Y: Roll (Heading)
    yawRad, // Trục Z: Yaw
    'YXZ'
  );
};
