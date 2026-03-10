import { useMemo, useState } from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import { SingleModelRenderer } from '../engine/SingleModelRenderer';
import { WGS84_TO_MERCATOR } from '../utils/coordinate';
import { Euler, Vector3 } from 'three';
import { MAP_CENTER } from '../utils/constants';

interface ModelManagerProps {
  centerCoord: { x: number; y: number; z: number; meterScale: number };
}

/**
 * Orchestrate model placement and group them by type for instancing.
 */
export const ModelManager = ({ centerCoord }: ModelManagerProps) => {
  // Sample data provided:
  const sampleModel = {
    name: 'cong',
    file: '/map3d/Ivory/cong.glb', // Adjusted to match project structure
    assetId: 4193440,
    lng: 105.464649,
    lat: 20.90334,
    height: 0,
    yaw: 0,
    pitch: 0,
    roll: 240,
    scale: 1,
  };

  /* 
  // Commented out instancing logic for now to focus on SingleModelRenderer
  const [seeds] = useState(() => ({
    trees: Array.from({ length: 500 }, () => ({
      r1: Math.random(),
      r2: Math.random(),
      r3: Math.random(),
      r4: Math.random(),
    })),
    lamps: Array.from({ length: 500 }, () => ({
      r1: Math.random(),
      r2: Math.random(),
      r3: Math.random(),
    })),
  }));

  const models = useMemo(() => {
    // ... instancing logic ...
    return { trees: [], lamps: [] };
  }, [centerCoord.x, centerCoord.y, centerCoord.z, seeds.trees]);
  */

  return (
    <>
      {/* Single Model from Sample Data */}
      <SingleModelRenderer
        url={sampleModel.file}
        lng={sampleModel.lng}
        lat={sampleModel.lat}
        height={sampleModel.height}
        yaw={sampleModel.yaw}
        pitch={sampleModel.pitch}
        roll={sampleModel.roll}
        scale={sampleModel.scale}
        centerCoord={centerCoord}
      />
    </>
  );
};
