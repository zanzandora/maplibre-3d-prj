import { useEffect, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { Canvas, useThree } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';
import { AdaptiveEvents } from '@react-three/drei';

interface MapThreeLayerProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
  children: React.ReactNode;
}

// Pre-allocate objects to avoid GC overhead in the render loop
const PROJECTION_MATRIX = new Matrix4();
const WORLD_MATRIX = new Matrix4();
const SCALE_VECTOR = new Vector3();

/**
 * Component nội bộ để đồng bộ Camera của R3F với MapLibre.
 */
const CameraSync = ({
  map,
  centerCoord,
}: Omit<MapThreeLayerProps, 'children'>) => {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const layerId = 'r3f-sync-layer';

    const customLayer: maplibregl.CustomLayerInterface = {
      id: layerId,
      type: 'custom',
      renderingMode: '3d',
      onAdd: () => {
        camera.matrixAutoUpdate = false;
      },
      render: (_gl, args) => {
        // 1. Sync Projection Matrix (MapLibre v5+)
        PROJECTION_MATRIX.fromArray(args.defaultProjectionData.mainMatrix);

        // 2. Sync World Matrix using centerCoord (Relative to Mercator)
        SCALE_VECTOR.set(
          centerCoord.meterScale,
          -centerCoord.meterScale,
          centerCoord.meterScale
        );

        WORLD_MATRIX.makeTranslation(
          centerCoord.x,
          centerCoord.y,
          centerCoord.z
        ).scale(SCALE_VECTOR);

        // 3. Inject into R3F Camera
        camera.projectionMatrix.copy(PROJECTION_MATRIX.multiply(WORLD_MATRIX));
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

        camera.matrixWorld.identity();
        camera.matrixWorldInverse.identity();

        // 4. Manual render pass synchronized with MapLibre's frame
        gl.render(scene, camera);
      },
    };

    if (!map.getLayer(layerId)) {
      map.addLayer(customLayer);
    }

    // Ép MapLibre render lại khi di chuyển để duy trì đồng bộ
    const syncRepaint = () => map.triggerRepaint();
    map.on('move', syncRepaint);
    map.on('rotate', syncRepaint);
    map.on('pitch', syncRepaint);

    return () => {
      map.off('move', syncRepaint);
      map.off('rotate', syncRepaint);
      map.off('pitch', syncRepaint);
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    };
  }, [map, camera, gl, scene, centerCoord]);

  return null;
};

/**
 * Hybrid 3D Layer: Render R3F trong một Canvas overlay riêng biệt.
 * Giải pháp này tránh xung đột WebGL Context và hỗ trợ đầy đủ hệ sinh thái R3F.
 */
export const MapThreeLayer = ({
  map,
  centerCoord,
  children,
}: MapThreeLayerProps) => {
  // Memoize light setup to avoid re-renders
  const lights = useMemo(
    () => (
      <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 100]} intensity={1.5} />
        <directionalLight position={[-10, -20, 100]} intensity={0.5} />
      </>
    ),
    []
  );

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance', // Ưu tiên GPU rời
        preserveDrawingBuffer: true,
      }}
      shadows={false}
      frameloop='never'
      dpr={window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio}
      // // Tối ưu Raycaster: Chỉ lấy vật thể đầu tiên và bỏ qua threshold cho Mesh
      // raycaster={{
      //   params: {
      //     Mesh: { threshold: 0 },
      //     LOD: { threshold: 0 },
      //     Sprite: { threshold: 0 },
      //     Line: { threshold: 0 },
      //     Points: { threshold: 0 },
      //   },
      // }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Cho phép bắt sự kiện click/up/down
      }}
    >
      <CameraSync map={map} centerCoord={centerCoord} />
      <AdaptiveEvents />

      {lights}
      {children}
    </Canvas>
  );
};
