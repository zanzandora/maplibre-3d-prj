import { useMemo } from 'react';
import { Matrix4, Vector3, Quaternion } from 'three';
import { WGS84_ELLIPSOID } from '3d-tiles-renderer/three';
import { Math as CesiumMath } from 'cesium';
import { MAP_CENTER } from '../../utils/constants';

/**
 * Hook to calculate the ECEF -> ENU transformation matrix at the map center.
 */
export const useMapCenterTransform = (heightOffset: number = 50) => {
  return useMemo(() => {
    const latRad = CesiumMath.toRadians(MAP_CENTER.lat);
    const lngRad = CesiumMath.toRadians(MAP_CENTER.lng);

    const matrix = new Matrix4();
    // 1. Create ENU -> ECEF frame at map center
    WGS84_ELLIPSOID.getEastNorthUpFrame(latRad, lngRad, 0, matrix);

    // 2. Invert to get ECEF -> ENU
    matrix.invert();

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();

    // 3. Decompose matrix for R3F group usage
    matrix.decompose(position, quaternion, scale);

    // 4. Height compensation
    position.z += heightOffset;

    return { position, quaternion, scale };
  }, [heightOffset]);
};
