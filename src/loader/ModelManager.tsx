import { useEffect, useMemo, useState } from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import {
  augmentData,
  getRelativePosition,
  getRelativeRotation,
} from '../utils/coordinate';
import { Euler, Vector3 } from 'three';

interface ModelData {
  name: string;
  file: string;
  assetId: number;
  lng: number;
  lat: number;
  height: number;
  yaw: number;
  pitch: number;
  roll: number;
  scale: number;
}

type GroupedInstances = Record<
  string,
  { id: string; position: Vector3; rotation: Euler; scale: Vector3 }[]
>;

interface ModelManagerProps {
  centerCoord: { x: number; y: number; z: number; meterScale: number };
}

/**
 * Orchestrate model placement and group them by type for instancing.
 * Loads 1000 models via data augmentation.
 */
export const ModelManager = ({ centerCoord }: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  // Sample data provided:
  // const sampleModel = {
  //   name: 'cong',
  //   file: '/map3d/Ivory/cong.glb', // Adjusted to match project structure
  //   assetId: 4193440,
  //   lng: 105.464649,
  //   lat: 20.90334,
  //   height: 0,
  //   yaw: 0,
  //   pitch: 0,
  //   roll: 240,
  //   scale: 1,
  // };

  // Fetch initial building data
  useEffect(() => {
    fetch('/map3d/Ivory/buildings.json')
      .then((res) => res.json())
      .then((data) => setRawData(data))
      .catch((err) => console.error('Error loading buildings.json:', err));
  }, []);

  // Data Augmentation: Clone 90 objects to reach 1000
  const augmentedModels = useMemo(() => {
    if (rawData.length === 0) return [];
    return augmentData(rawData, 1000, 0.05);
  }, [rawData]);

  // Group by file URL and convert coordinates to local Vector3 relative to centerCoord
  const groupedModels = useMemo(() => {
    const groups: GroupedInstances = {};

    augmentedModels.forEach((model, index) => {
      const position = getRelativePosition(
        model.lng,
        model.lat,
        model.height,
        centerCoord
      );

      const rotation = getRelativeRotation(model.yaw, model.pitch, model.roll);
      const scale = new Vector3(model.scale, model.scale, model.scale);

      if (!groups[model.file]) groups[model.file] = [];

      groups[model.file].push({
        id: `${model.name}-${index}`,
        position,
        rotation,
        scale,
      });
    });

    return groups;
  }, [augmentedModels, centerCoord]);

  return (
    <>
      {/* <SingleModelRenderer
        url={sampleModel.file}
        lng={sampleModel.lng}
        lat={sampleModel.lat}
        height={sampleModel.height}
        yaw={sampleModel.yaw}
        pitch={sampleModel.pitch}
        roll={sampleModel.roll}
        scale={sampleModel.scale}
        centerCoord={centerCoord}
      /> */}
      {Object.entries(groupedModels).map(([url, instances]) => (
        <InstanceRenderer key={url} url={url} instances={instances} />
      ))}
    </>
  );
};
