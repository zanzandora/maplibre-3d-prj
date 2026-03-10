import { useGLTF } from '@react-three/drei';
import { Euler, Vector3 } from 'three';
import { useMemo } from 'react';
import maplibregl from 'maplibre-gl';

interface SingleModelProps {
  url: string;
  lng: number;
  lat: number;
  height?: number;
  yaw?: number; // Heading (degrees)
  pitch?: number; // Tilt (degrees)
  roll?: number; // Rotation (degrees)
  scale?: number;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
}

/**
 * Renders a single GLB model at a specific geographic location.
 * Uses meter-based coordinates relative to centerCoord.
 */
export const SingleModelRenderer = ({
  url,
  lng,
  lat,
  height = 0,
  yaw = 0,
  pitch = 0,
  roll = 0,
  scale = 1,
  centerCoord,
}: SingleModelProps) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Calculate position in METERS relative to centerCoord
  const position = useMemo(() => {
    const coord = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], height);

    // Difference in Mercator units divided by meterScale gives distance in meters
    return new Vector3(
      (coord.x - centerCoord.x) / centerCoord.meterScale,
      -(coord.y - centerCoord.y) / centerCoord.meterScale, // Flip Y for Three.js
      (coord.z - centerCoord.z) / centerCoord.meterScale
    );
  }, [lng, lat, height, centerCoord]);

  // Apply rotations:
  // 1. Initial rotation to make GLB stand up (PI/2 around X)
  // 2. User defined yaw, pitch, roll
  const rotation = useMemo(() => {
    return new Euler(
      Math.PI / 2 + (pitch * Math.PI) / 180,
      (yaw * Math.PI) / 180,
      (roll * Math.PI) / 180
    );
  }, [pitch, yaw, roll]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    />
  );
};
