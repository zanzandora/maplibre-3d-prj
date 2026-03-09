import maplibregl from 'maplibre-gl';
import { Vector3 } from 'three';

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
 * Since coordinates in Mercator are in [0, 1] range,
 * use a reference center to avoid floating-point precision jittering.
 */
export const getRelativePosition = (
  lng: number,
  lat: number,
  alt: number,
  center: { x: number; y: number; z: number }
) => {
  const pos = WGS84_TO_MERCATOR(lng, lat, alt);
  return new Vector3(pos.x - center.x, pos.y - center.y, pos.z - center.z);
};
