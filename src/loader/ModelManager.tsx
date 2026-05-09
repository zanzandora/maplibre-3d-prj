import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  Suspense,
  useLayoutEffect,
} from 'react';
import { InstanceRenderer } from '../engine/InstanceRenderer';
import {
  getRelativePosition,
  getRelativeRotation,
  isWithinBounds,
} from '../utils/coordinate';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { type Map, type MapSourceDataEvent } from 'maplibre-gl';
import type {
  CenterCoordinate,
  GroupedInstances,
  InstanceData,
  ModelData,
} from '../utils/types';
import { Bvh, Preload } from '@react-three/drei';
import { useIsMounted } from '../hooks/useIsMounted';
import { MODEL_HEIGHT_OFFSET } from '../utils/constants';
// import { fetchBuildingModels } from '../lib/action/map3d';

interface ModelManagerProps {
  centerCoord: CenterCoordinate;
  map: Map;
  isVisible: boolean;
  onLoadComplete?: () => void;
  siteId?: number; // Optional prop to specify site
}

const DUMMY = new Object3D();

const FallbackBox = ({ instances }: { instances: InstanceData[] }) => {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || instances.length === 0) return;
    instances.forEach((inst, i) => {
      DUMMY.position.copy(inst.position);
      // Tạm thời hiển thị các box to để đánh dấu vị trí
      const s = inst.scale ? inst.scale.x * 10 : 10;
      DUMMY.scale.set(s, s, s);
      DUMMY.updateMatrix();
      meshRef.current!.setMatrixAt(i, DUMMY.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instances.length]}
    >
      <boxGeometry args={[1, 1, 1]} />
      {/* Box màu đỏ/cam nhạt để biết nó đang loading */}
      <meshStandardMaterial color='#ff9900' wireframe />
    </instancedMesh>
  );
};

/**
 * ModelManager with Optimized Tile Loading & Elevation Snapping.
 * Refactored to eliminate flickering during map interactions.
 */
export const ModelManager = ({
  centerCoord,
  map,
  isVisible,
  onLoadComplete,
}: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  // note: Initialize with empty Float32Array to ensure stable reference and no null-flicker
  const [elevations, setElevations] = useState<Float32Array>(
    new Float32Array(0)
  );

  const isMounted = useIsMounted();
  const rafRef = useRef<number>(0);
  const boundsRafRef = useRef<number>(0);
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

  // todo: Initial Data Fetch from JSON (API logic commented for future use)
  useEffect(() => {
    /*
    fetchBuildingModels(currentSite)
      .then((buildings) => {
        if (isMounted()) {
          setRawData(buildings);
          setElevations(new Float32Array(buildings.length).fill(0));
        }
      })
      .catch((err) => console.error('Error loading buildings from API:', err));
    */

    fetch('/map3d/utopia/buildings_3dtiles_out.json')
      .then((res) => res.json())
      .then((buildings) => {
        if (isMounted()) {
          setRawData(buildings);
          setElevations(new Float32Array(buildings.length).fill(0));
        }
      })
      .catch((err) => console.error('Error loading buildings from JSON:', err));
  }, [isMounted]);

  // note: Caching static properties (Rotation/Scale) to avoid GC pressure and unnecessary re-calcs
  const staticProperties = useMemo(() => {
    return rawData.map((m) => ({
      rotation: getRelativeRotation(m.yaw, m.pitch, m.roll),
      scale: new Vector3(m.scale, m.scale, m.scale),
    }));
  }, [rawData]);

  /*
    note: Atomic elevation reset when toggling visibility
  */
  useEffect(() => {
    if (isVisible && rawData.length > 0) {
      requestAnimationFrame(() => {
        setElevations(new Float32Array(rawData.length).fill(0));
        initializedRef.current = false;
      });
    }
  }, [isVisible, rawData.length]);

  /**
   * todo: Core Elevation Logic (Spatial Filtering & Throttled)
   */
  const updateAllElevations = useCallback(() => {
    if (!isMounted() || !map || !isVisible || elevations.length === 0) return;

    const terrain = map.getTerrain();
    if (!terrain) return;

    let hasChanged = false;
    const newElevations = new Float32Array(elevations);

    // note: CHỈ TRUY VẤN model trong vùng nhìn thấy (Spatial Filter)
    rawData.forEach((model, index) => {
      if (!isWithinBounds(model.lng, model.lat, visibleBounds)) return;

      const alt = map.queryTerrainElevation([model.lng, model.lat]) || 0;
      // note: Sử dụng ngưỡng 0.05m để tránh cập nhật quá li ti gây nháy
      if (Math.abs(newElevations[index] - alt) > 0.05) {
        newElevations[index] = alt;
        hasChanged = true;
      }
    });

    if (hasChanged || !initializedRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!isMounted()) return;
        setElevations(newElevations);
        initializedRef.current = true;
        onLoadComplete?.();
      });
    }
  }, [
    rawData,
    map,
    isVisible,
    elevations,
    visibleBounds,
    onLoadComplete,
    isMounted,
  ]);

  // todo: Listen to Map Events
  useEffect(() => {
    if (rawData.length === 0 || !map) return;

    const handleData = (e: MapSourceDataEvent) => {
      // note: Lắng nghe terrain nạp trong khi di chuyển để snap cao độ kịp thời
      if (
        e.dataType === 'source' &&
        e.sourceId?.includes('terrain') &&
        isVisible
      ) {
        updateAllElevations();
      }
    };

    // note: Cập nhật bounds mượt mà bằng rAF thay vì chỉ đợi moveend
    const onMove = () => {
      if (boundsRafRef.current) cancelAnimationFrame(boundsRafRef.current);
      boundsRafRef.current = requestAnimationFrame(() => {
        const b = map.getBounds();
        setVisibleBounds({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
        });
      });
    };

    map.on('data', handleData);
    map.on('move', onMove);
    map.on('idle', updateAllElevations);

    updateAllElevations();

    return () => {
      map.off('data', handleData);
      map.off('move', onMove);
      map.off('idle', updateAllElevations);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (boundsRafRef.current) cancelAnimationFrame(boundsRafRef.current);
    };
  }, [rawData.length, map, isVisible, updateAllElevations]);

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
    if (!isVisible || elevations.length === 0) return {};

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

      // note: Sử dụng static properties đã cache
      const { rotation, scale } = staticProperties[index];

      if (!groups[model.file]) groups[model.file] = [];

      groups[model.file].push({
        id: `${model.name}-${index}`,
        position,
        rotation,
        scale,
      });
    });

    return groups;
  }, [
    rawData,
    centerCoord,
    elevations,
    bufferedBounds,
    isVisible,
    staticProperties,
  ]);

  return (
    <group visible={isVisible}>
      <Bvh firstHitOnly>
        {Object.entries(groupedModels).map(([url, instances]) => (
          <Suspense key={url} fallback={<FallbackBox instances={instances} />}>
            <InstanceRenderer url={url} instances={instances} />
          </Suspense>
        ))}
        <Preload all />
      </Bvh>
    </group>
  );
};
