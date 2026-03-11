import maplibregl from 'maplibre-gl';
import { Euler, Vector3 } from 'three';

/**
 * World projection math for MapLibre & Three.js alignment.
 */
export const WGS84_TO_MERCATOR = (
  lng: number,
  lat: number,
  alt: number = 0
) => {
  const coord = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], alt);
  return {
    x: coord.x,
    y: coord.y,
    z: coord.z || 0,
    meterScale: coord.meterInMercatorCoordinateUnits(),
  };
};

/**
 * Calculate position in METERS relative to centerCoord.
 */
export const getRelativePosition = (
  lng: number,
  lat: number,
  alt: number,
  center: { x: number; y: number; z: number; meterScale: number }
) => {
  const coord = WGS84_TO_MERCATOR(lng, lat, alt);

  return new Vector3(
    (coord.x - center.x) / center.meterScale,
    -(coord.y - center.y) / center.meterScale, // Flip Y for Three.js
    (coord.z - center.z) / center.meterScale
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

  return new Euler(
    Math.PI / 2 + pitchRad, // Trục X: Dựng đứng model + Pitch
    Math.PI / 2 + rollRad, // Trục Y: Roll (Heading)
    yawRad, // Trục Z: Yaw
    'XZY'
  );
};

/**
 * Augment data to reach a target count by cloning existing items with random offsets.
 */
export const augmentData = <
  T extends { lng: number; lat: number; yaw?: number }
>(
  data: T[],
  targetCount: number,
  offsetRange: number = 0.0005 // Khoảng cách sai lệch tối đa so với vị trí gốc
): T[] => {
  if (data.length === 0) return [];
  const augmented: T[] = [...data];
  let i = 0;
  while (augmented.length < targetCount) {
    const original = data[i % data.length];
    augmented.push({
      ...original,
      // Cộng thêm một giá trị ngẫu nhiên trong khoảng từ -offsetRange/2 đến +offsetRange/2
      lng: original.lng + (Math.random() - 0.5) * offsetRange,
      lat: original.lat + (Math.random() - 0.5) * offsetRange,
    });
    i++;
  }
  return augmented;
};
