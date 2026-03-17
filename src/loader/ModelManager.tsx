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
// import { MapClickInterceptor } from '../engine/MapClickInterceptor';

interface ModelManagerProps {
  centerCoord: CenterCoordinate;
  map: maplibregl.Map;
  isVisible: boolean;
  onLoadComplete?: () => void;
}

/**
 * ModelManager with basic Tile Loading (Chunking).
 * Divides the world into a grid and only renders models in visible tiles.
 */
export const ModelManager = ({
  centerCoord,
  map,
  isVisible,
  onLoadComplete,
}: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  const [elevations, setElevations] = useState<Record<number, number>>({});
  const [zoom, setZoom] = useState(map.getZoom());

  const rafRef = useRef<number>(0);
  // todo: Sync Elevation with Terrain
  const initializedRef = useRef<boolean>(false);

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

  // note: Reset cache khi toggle Terrain để ép quét lại cao độ mới nhất
  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => {
        setElevations({});
        initializedRef.current = false;
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (rawData.length === 0 || !map || !isVisible) return;

    let isMounted = true;

    // Nếu đã quét đủ và isVisible không đổi thì không quét lại (tránh loop)
    if (
      Object.keys(elevations).length === rawData.length &&
      initializedRef.current
    ) {
      if (onLoadComplete) onLoadComplete();
      return;
    }

    const updateAllElevations = () => {
      // note: Defensive check - if map is destroyed or unmounted, abort.
      if (!isMounted || !map || !map.getStyle || !map.getStyle()) return;

      const terrain = map.getTerrain();
      if (!terrain) return;

      // note: Compute everything once and cache
      const updatedElevations: Record<number, number> = {};
      let hasValidData = false;

      rawData.forEach((model, index) => {
        const alt = map.queryTerrainElevation([model.lng, model.lat]);
        if (alt !== null && alt !== undefined) {
          updatedElevations[index] = alt;
          if (alt !== 0) hasValidData = true; // Đã có cao độ thực tế
        } else {
          updatedElevations[index] = 0;
        }
      });

      // Chỉ cập nhật nếu thực sự có dữ liệu terrain (tránh snap về 0 quá sớm)
      if (hasValidData || initializedRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          if (!isMounted) return;
          setElevations(updatedElevations);
          initializedRef.current = true;
          if (onLoadComplete) onLoadComplete();
        });
      }
    };

    // Terrain tiles might load later, so we listen for data events
    const handleData = (e: MapSourceDataEvent) => {
      if (e.dataType === 'source' && e.sourceId?.includes('terrain')) {
        updateAllElevations();
      }
    };

    map.on('data', handleData);

    // Thử quét ngay lập tức
    updateAllElevations();

    // Idle là sự kiện tốt để chốt hạ lần cuối
    map.once('idle', updateAllElevations);

    return () => {
      isMounted = false;
      map.off('data', handleData);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rawData, map, isVisible, onLoadComplete, elevations]);

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
    };

    map.on('moveend', updateView);

    return () => {
      map.off('moveend', updateView);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map]);

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
      {/* <MapClickInterceptor
        map={map}
        onModelClick={(id) => {
          console.log('✅ ModelManager: Clicked', id);
          setSelectedId(id);
        }}
      /> */}
      <Bvh firstHitOnly>
        {Object.entries(groupedModels).map(([url, instances]) => (
          <InstanceRenderer
            key={url}
            url={url}
            instances={instances}
            zoom={zoom}
            // selectedId={selectedId}
          />
        ))}
      </Bvh>
    </group>
  );
};
