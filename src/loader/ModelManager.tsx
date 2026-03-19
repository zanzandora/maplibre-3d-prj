import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  Suspense,
} from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import {
  getRelativePosition,
  getRelativeRotation,
  isWithinBounds,
} from '../utils/coordinate';
import { Vector3 } from 'three';
import { type Map, type MapSourceDataEvent } from 'maplibre-gl';
import type {
  CenterCoordinate,
  GroupedInstances,
  ModelData,
} from '../utils/types';
import { Bvh } from '@react-three/drei';
import { useIsMounted } from '../hooks/useIsMounted';
import { MODEL_HEIGHT_OFFSET } from '../utils/constants';

interface ModelManagerProps {
  centerCoord: CenterCoordinate;
  map: Map;
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

  const isMounted = useIsMounted();

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

  // todo: Initial Data Fetch
  useEffect(() => {
    fetch('/map3d/ivory/buildings.json')
      .then((res) => res.json())
      .then(setRawData)
      .catch((err) => console.error('Error loading buildings:', err));
  }, []);

  /*
    note: Tại sao phải xóa cache khi toggle Terrain?
    Khi Terrain OFF, cao độ mặc định là 0. Khi Terrain ON, chúng ta cần quét lại 
    để lấy giá trị Elevation thực tế từ MapLibre.
  */
  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => {
        setElevations({});
        initializedRef.current = false;
      });
    }
  }, [isVisible]);

  /**
   * 3. Core Elevation Logic (Throttled & Interaction-Aware)
   */
  const updateAllElevations = useCallback(() => {
    // note: Throttling - Tránh tính toán nặng khi người dùng đang thao tác
    if (
      !isMounted() ||
      !map ||
      !map.getStyle ||
      !map.getStyle() ||
      !isVisible ||
      map.isMoving() ||
      map.isZooming() ||
      map.isRotating()
    ) {
      return;
    }

    const terrain = map.getTerrain();
    if (!terrain) return;

    const updatedElevations: Record<number, number> = {};
    let hasValidData = false;

    rawData.forEach((model, index) => {
      const alt = map.queryTerrainElevation([model.lng, model.lat]);

      if (alt !== null && alt !== undefined) {
        updatedElevations[index] = alt;
        if (alt !== 0) hasValidData = true;
      } else {
        updatedElevations[index] = 0;
      }
    });

    // Cập nhật state thông qua requestAnimationFrame để mượt mà
    if (hasValidData || initializedRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!isMounted()) return;
        setElevations(updatedElevations);
        initializedRef.current = true;

        if (onLoadComplete) {
          onLoadComplete();
        }
      });
    }
  }, [rawData, map, isVisible, onLoadComplete, isMounted]);

  // note: Listen to Map Events for Elevation Snapping
  useEffect(() => {
    if (rawData.length === 0 || !map || !isVisible) return;

    const handleData = (e: MapSourceDataEvent) => {
      // Chỉ snap khi tile tới VÀ không trong lúc đang di chuyển
      if (
        e.dataType === 'source' &&
        e.sourceId?.includes('terrain') &&
        !map.isMoving()
      ) {
        updateAllElevations();
      }
    };

    map.on('data', handleData);
    map.on('idle', updateAllElevations);

    // Initial check
    updateAllElevations();

    return () => {
      map.off('data', handleData);
      map.off('idle', updateAllElevations);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rawData, map, isVisible, updateAllElevations]);

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
      const adjustedHeight = model.height + terrainHeight + MODEL_HEIGHT_OFFSET;

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
      <Bvh firstHitOnly>
        <Suspense fallback={null}>
          {Object.entries(groupedModels).map(([url, instances]) => (
            <InstanceRenderer
              key={url}
              url={url}
              instances={instances}
              zoom={zoom}
            />
          ))}
        </Suspense>
      </Bvh>
    </group>
  );
};
