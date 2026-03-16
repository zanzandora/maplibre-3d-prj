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
  isVisible: boolean;
}

/**
 * ModelManager with basic Tile Loading (Chunking).
 * Divides the world into a grid and only renders models in visible tiles.
 */
export const ModelManager = ({
  centerCoord,
  map,
  isVisible,
}: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  const [elevations, setElevations] = useState<Record<number, number>>({});
  const [zoom, setZoom] = useState(map.getZoom());
  const rafRef = useRef<number>(0);

  // todo: Track visible bounds to filter models
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

  // todo: Initial Data Fetch
  useEffect(() => {
    fetch('/map3d/ivory/buildings.json')
      .then((res) => res.json())
      .then(setRawData)
      .catch((err) => console.error('Error loading buildings:', err));
  }, []);

  // todo: Tối ưu hóa việc quét Elevation: Quét liên tục cho đến khi hoàn tất vùng nhìn
  const updateVisibleElevations = useCallback(() => {
    if (!map.getTerrain() || rawData.length === 0) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
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
        let missingInView = 0;

        // Giới hạn số lượng quét mỗi frame để tránh drop fps
        let scanCount = 0;
        const MAX_SCAN_PER_FRAME = 300;

        for (let i = 0; i < rawData.length; i++) {
          const model = rawData[i];
          if (isWithinBounds(model.lng, model.lat, currentBounds)) {
            if (next[i] === undefined) {
              if (scanCount < MAX_SCAN_PER_FRAME) {
                const h = map.queryTerrainElevation([model.lng, model.lat]);
                if (h !== null && h !== undefined) {
                  next[i] = h;
                  hasNew = true;
                  scanCount++;
                } else {
                  missingInView++;
                }
              } else {
                missingInView++;
              }
            }
          }
        }

        // Nếu vẫn còn model trong vùng nhìn chưa có elevation, tiếp tục quét ở frame tiếp theo
        if (missingInView > 0) {
          // eslint-disable-next-line react-hooks/immutability
          rafRef.current = requestAnimationFrame(updateVisibleElevations);
        }

        return hasNew ? next : prev;
      });
    });
  }, [map, rawData]);

  // todo: Map Event Listeners
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
      updateVisibleElevations();
    };

    const handleMapData = (e: MapSourceDataEvent) => {
      // Lắng nghe cả sourcedata và data để bắt kịp tiến độ load terrain
      if (
        e.dataType === 'source' &&
        (e.sourceId === 'maptiler-terrain' || e.sourceId === 'terrain')
      ) {
        updateVisibleElevations();
      }
    };

    map.on('moveend', updateView);
    map.on('idle', updateVisibleElevations);
    map.on('sourcedata', handleMapData);
    map.on('data', handleMapData);

    // Initial call
    updateVisibleElevations();

    return () => {
      map.off('moveend', updateView);
      map.off('idle', updateVisibleElevations);
      map.off('sourcedata', handleMapData);
      map.off('data', handleMapData);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, updateVisibleElevations]);

  // todo: Tile Filtering & Grouping
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
    <group visible={isVisible}>
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
    </group>
  );
};
