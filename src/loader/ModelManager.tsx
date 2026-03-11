import { useEffect, useMemo, useState } from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import { getRelativePosition, getRelativeRotation } from '../utils/coordinate';
import { Vector3 } from 'three';
import maplibregl from 'maplibre-gl';
import type {
  CenterCoordinate,
  GroupedInstances,
  ModelData,
} from '../utils/types';

interface ModelManagerProps {
  centerCoord: CenterCoordinate;
  map?: maplibregl.Map;
}

/**
 * Orchestrate model placement and group them by type for instancing.
 * Loads models and synchronizes their height with MapLibre terrain.
 */
export const ModelManager = ({ centerCoord, map }: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  const [elevations, setElevations] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch('/map3d/ivory/buildings.json')
      .then((res) => res.json())
      .then((data) => setRawData(data))
      .catch((err) => console.error('Error loading buildings.json:', err));
  }, []);

  // todo: Calculate missing elevations when map is idle
  useEffect(() => {
    if (!map || rawData.length === 0) return;

    const fetchElevations = () => {
      if (!map.getTerrain()) return;

      setElevations((prev) => {
        let hasNewData = false;
        const nextElevations = { ...prev };

        rawData.forEach((model, index) => {
          // * Only query if we don't already have the elevation for this model
          if (nextElevations[index] === undefined) {
            const queried = map.queryTerrainElevation([model.lng, model.lat]);
            if (queried !== undefined && queried !== null) {
              nextElevations[index] = queried;
              hasNewData = true;
              console.log('Miss');
            }
          }
        });
        console.log('HIT ELEVATION QUERY:');

        // Only return a new object if data actually changed to avoid unnecessary re-renders
        return hasNewData ? nextElevations : prev;
      });
    };

    map.on('idle', fetchElevations);
    fetchElevations(); // Attempt an immediate fetch

    return () => {
      map.off('idle', fetchElevations);
    };
  }, [map, rawData]);

  // todo: Group by file URL and convert coordinates to local Vector3 relative to centerCoord
  const groupedModels = useMemo(() => {
    const groups: GroupedInstances = {};

    rawData.forEach((model, index) => {
      // Use cached elevation if available
      const terrainHeight = elevations[index] || 0;
      const adjustedHeight = model.height + terrainHeight;

      const position = getRelativePosition(
        model.lng,
        model.lat,
        adjustedHeight,
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
  }, [rawData, centerCoord, elevations]);

  return (
    <>
      {Object.entries(groupedModels).map(([url, instances]) => (
        <InstanceRenderer key={url} url={url} instances={instances} />
      ))}
    </>
  );
};
