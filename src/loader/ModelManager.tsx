import { useEffect, useMemo, useState, useRef } from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import {
  getRelativePosition,
  getRelativeRotation,
  isWithinBounds,
} from '../utils/coordinate';
import { Vector3 } from 'three';
import maplibregl, { type MapSourceDataEvent } from 'maplibre-gl';
import type {
  CenterCoordinate,
  GroupedInstances,
  ModelData,
} from '../utils/types';
import { Bvh } from '@react-three/drei';

interface ModelManagerProps {
  centerCoord: CenterCoordinate;
  map: maplibregl.Map;
}

/**
 * ModelManager with basic Tile Loading (Chunking).
 * Divides the world into a grid and only renders models in visible tiles.
 */
export const ModelManager = ({ centerCoord, map }: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  const [elevations, setElevations] = useState<Record<number, number>>({});
  const [zoom, setZoom] = useState(map.getZoom());
  const rafRef = useRef<number>(0);

  // Track visible bounds to filter models
  const [visibleBounds, setVisibleBounds] = useState(() => {
    const b = map.getBounds();
    return {
      minLng: b.getWest(),
      minLat: b.getSouth(),
      maxLng: b.getEast(),
      maxLat: b.getNorth(),
    };
  });

  // 1. Initial Data Fetch
  useEffect(() => {
    fetch('/map3d/ivory/buildings.json')
      .then((res) => res.json())
      .then(setRawData)
      .catch((err) => console.error('Error loading buildings:', err));
  }, []);

  // 2. Map Event Listeners
  useEffect(() => {
    if (!map) return;

    const updateView = () => {
      const b = map.getBounds();
      setVisibleBounds({
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth(),
      });
      setZoom(map.getZoom());
    };

    const updateElevations = () => {
      // note: Throttling terrain calculation with requestAnimationFrame
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!map.getTerrain()) return;
        setElevations((prev) => {
          const next = { ...prev };
          let hasNew = false;
          rawData.forEach((model, index) => {
            if (next[index] === undefined) {
              const h = map.queryTerrainElevation([model.lng, model.lat]);
              if (h !== null && h !== undefined) {
                next[index] = h;
                hasNew = true;
              }
            }
          });
          return hasNew ? next : prev;
        });
      });
    };

    const handleSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === 'maptiler-terrain' && e.isSourceLoaded) {
        updateElevations();
      }
    };

    map.on('moveend', updateView);
    map.on('idle', updateElevations);
    map.on('sourcedata', handleSourceData);

    // Initial call in case map is already idle and rawData just arrived
    updateElevations();

    return () => {
      map.off('moveend', updateView);
      map.off('idle', updateElevations);
      map.off('sourcedata', handleSourceData);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, rawData]);

  // 3. Tile Filtering & Grouping
  // We apply a small padding to the bounds to load models just before they enter the screen.
  const padding = 0.002; // Roughly 200m
  const bufferedBounds = useMemo(
    () => ({
      minLng: visibleBounds.minLng - padding,
      minLat: visibleBounds.minLat - padding,
      maxLng: visibleBounds.maxLng + padding,
      maxLat: visibleBounds.maxLat + padding,
    }),
    [visibleBounds]
  );

  const groupedModels = useMemo(() => {
    const groups: GroupedInstances = {};

    rawData.forEach((model, index) => {
      // Basic Tile Loading: Only process models within buffered viewport
      if (!isWithinBounds(model.lng, model.lat, bufferedBounds)) return;

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

    console.log('Số lượng model đang render', Object.keys(groups).length);
    return groups;
  }, [rawData, centerCoord, elevations, bufferedBounds]);

  return (
    <>
      <Bvh firstHitOnly>
        {Object.entries(groupedModels).map(([url, instances]) => (
          <InstanceRenderer
            key={url}
            url={url}
            instances={instances}
            zoom={zoom}
          />
        ))}
      </Bvh>
    </>
  );
};
