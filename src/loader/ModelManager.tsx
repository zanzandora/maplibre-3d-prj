import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
import { MapClickInterceptor } from '../engine/MapClickInterceptor';

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

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // note: Đảm bảo MapLibre repaint sau khi React đã cập nhật xong trạng thái Highlight vào Three.js
  useEffect(() => {
    if (selectedId) {
      map.triggerRepaint();
    }
  }, [selectedId, map]);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetch('/map3d/ivory/buildings.json')
      .then((res) => res.json())
      .then(setRawData)
      .catch((err) => console.error('Error loading buildings:', err));
  }, []);

  // 2. Tối ưu hóa việc quét Elevation: Chỉ quét những gì đang hiện thấy
  const updateVisibleElevations = useCallback(() => {
    if (!map.getTerrain() || rawData.length === 0) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      // Sử dụng bounds hiện tại của map để lọc nhanh
      const b = map.getBounds();
      const currentBounds = {
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth(),
      };

      setElevations((prev) => {
        const next = { ...prev };
        let hasNew = false;

        // Chỉ quét các model đang nằm trong vùng nhìn
        rawData.forEach((model, index) => {
          if (
            next[index] === undefined &&
            isWithinBounds(model.lng, model.lat, currentBounds)
          ) {
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
  }, [map, rawData]);

  // 3. Map Event Listeners
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
      // Thử cập nhật elevation ngay khi view thay đổi
      updateVisibleElevations();
    };

    const handleSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === 'maptiler-terrain' && e.isSourceLoaded) {
        updateVisibleElevations();
      }
    };

    map.on('moveend', updateView);
    map.on('idle', updateVisibleElevations);
    map.on('sourcedata', handleSourceData);

    // Initial call
    updateVisibleElevations();

    return () => {
      map.off('moveend', updateView);
      map.off('idle', updateVisibleElevations);
      map.off('sourcedata', handleSourceData);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, updateVisibleElevations]);

  // 4. Tile Filtering & Grouping
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

    return groups;
  }, [rawData, centerCoord, elevations, bufferedBounds]);

  return (
    <>
      <MapClickInterceptor
        map={map}
        onModelClick={(id) => {
          console.log('✅ ModelManager: Clicked', id);
          setSelectedId(id);
        }}
      />
      <Bvh firstHitOnly>
        {Object.entries(groupedModels).map(([url, instances]) => (
          <InstanceRenderer
            key={url}
            url={url}
            instances={instances}
            zoom={zoom}
            selectedId={selectedId}
          />
        ))}
      </Bvh>
    </>
  );
};
