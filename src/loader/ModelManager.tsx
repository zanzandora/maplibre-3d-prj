import {
  useEffect,
  useMemo,
  useState,
  useRef,
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
import { type Map } from 'maplibre-gl';
import type {
  CenterCoordinate,
  GroupedInstances,
  InstanceData,
  ModelData,
} from '../utils/types';
import { Bvh, Preload } from '@react-three/drei';
import { useIsMounted } from '../hooks/useIsMounted';
import { MODEL_HEIGHT_OFFSET } from '../utils/constants';
import { SITES_LIST } from '../utils/siteList';
import { fetchBuildingModels } from '../lib/action/map3d';

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
  siteId = 175, // Default to Bệnh viện 175
}: ModelManagerProps) => {
  const [rawData, setRawData] = useState<ModelData[]>([]);
  const [zoom, setZoom] = useState(map.getZoom());

  const isMounted = useIsMounted();
  const boundsRafRef = useRef<number>(0);

  const currentSite = useMemo(
    () => SITES_LIST.find((s) => s.site_id === siteId) || SITES_LIST[0],
    [siteId]
  );

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

  // Initial Data Fetch
  useEffect(() => {
    fetchBuildingModels(currentSite)
      .then((buildings) => {
        if (isMounted()) {
          setRawData(buildings);
          onLoadComplete?.();
        }
      })
      .catch((err) => console.error('Error loading buildings:', err));
  }, [currentSite, isMounted, onLoadComplete]);

  // Caching static properties (Rotation/Scale)
  const staticProperties = useMemo(() => {
    return rawData.map((m) => ({
      rotation: getRelativeRotation(m.yaw, m.pitch, m.roll),
      scale: new Vector3(m.scale, m.scale, m.scale),
    }));
  }, [rawData]);

  // Listen to Map Move/Zoom events to update bounds
  useEffect(() => {
    if (!map) return;

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
        setZoom(map.getZoom());
      });
    };

    map.on('move', onMove);
    onMove();

    return () => {
      map.off('move', onMove);
      if (boundsRafRef.current) cancelAnimationFrame(boundsRafRef.current);
    };
  }, [map]);

  // Tile Filtering & Grouping for 2D Map (No Terrain required)
  const padding = 0.05;
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
    if (!isVisible) return {};

    const groups: GroupedInstances = {};

    rawData.forEach((model, index) => {
      if (!isWithinBounds(model.lng, model.lat, bufferedBounds)) return;

      const adjustedHeight = model.height + MODEL_HEIGHT_OFFSET;

      const position = getRelativePosition(
        model.lng,
        model.lat,
        adjustedHeight,
        centerCoord
      );

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
    bufferedBounds,
    isVisible,
    staticProperties,
  ]);

  return (
    <group visible={isVisible}>
      <Bvh firstHitOnly>
        {Object.entries(groupedModels).map(([url, instances]) => (
          <Suspense key={url} fallback={<FallbackBox instances={instances} />}>
            <InstanceRenderer url={url} instances={instances} zoom={zoom} />
          </Suspense>
        ))}
        <Preload all />
      </Bvh>
    </group>
  );
};
