import { useMemo, useState } from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import { WGS84_TO_MERCATOR } from '../utils/coordinate';
import { Euler, Vector3 } from 'three';

interface ModelManagerProps {
  centerCoord: { x: number; y: number; z: number };
}

/**
 * Orchestrate model placement and group them by type for instancing.
 */
export const ModelManager = ({ centerCoord }: ModelManagerProps) => {
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
    const trees = [];
    const lamps = [];

    // Example: generate 1000 random objects in a bounding box near center.
    // Near center: ± 0.005 degrees.
    const baseLng = 105.8342; // Example: Hanoi center
    const baseLat = 21.0285;

    for (let i = 0; i < 500; i++) {
      const seed = seeds.trees[i];
      const lng = baseLng + (seed.r1 - 0.5) * 0.01;
      const lat = baseLat + (seed.r2 - 0.5) * 0.01;

      const mercPos = WGS84_TO_MERCATOR(lng, lat, 0);
      const relativePos = new Vector3(
        mercPos.x - centerCoord.x,
        mercPos.y - centerCoord.y,
        mercPos.z - centerCoord.z
      );

      trees.push({
        id: `tree_${i}`,
        position: relativePos,
        scale: new Vector3(10, 10, 10).multiplyScalar(0.5 + seed.r3),
        rotation: new Euler(0, seed.r4 * Math.PI, 0),
      });
    }

    for (let i = 0; i < 500; i++) {
      const seed = seeds.lamps[i];
      const lng = baseLng + (seed.r1 - 0.5) * 0.01;
      const lat = baseLat + (seed.r2 - 0.5) * 0.01;

      const mercPos = WGS84_TO_MERCATOR(lng, lat, 0);
      const relativePos = new Vector3(
        mercPos.x - centerCoord.x,
        mercPos.y - centerCoord.y,
        mercPos.z - centerCoord.z
      );

      lamps.push({
        id: `lamp_${i}`,
        position: relativePos,
        scale: new Vector3(0.05, 0.05, 0.05).multiplyScalar(1 + seed.r3),
      });
    }

    return { trees, lamps };
  }, [centerCoord.x, centerCoord.y, centerCoord.z, seeds.lamps, seeds.trees]);

  const handleInstanceClick = (id: string) => {
    console.log(`Clicked on instance: ${id}`);
  };

  return (
    <>
      <InstanceRenderer
        url='/Ivory3D/villa3.glb'
        instances={models.trees}
        onInstanceClick={handleInstanceClick}
      />
      {/* Add more instances as needed */}
    </>
  );
};
