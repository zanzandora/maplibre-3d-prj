import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { Canvas, useThree } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';

interface MapThreeLayerProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
  children: React.ReactNode;
}

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
        // Vô hiệu hóa auto update matrix để MapLibre toàn quyền điều khiển
        camera.matrixAutoUpdate = false;
      },
      render: (_gl, args) => {
        // 1. Lấy ma trận projection-view từ MapLibre (v5+ style)
        const m = new Matrix4().fromArray(
          args.defaultProjectionData.mainMatrix
        );

        // 2. Đồng bộ không gian Three.js với Mercator của MapLibre qua centerCoord
        const l = new Matrix4()
          .makeTranslation(centerCoord.x, centerCoord.y, centerCoord.z)
          .scale(
            new Vector3(
              centerCoord.meterScale,
              -centerCoord.meterScale,
              centerCoord.meterScale
            )
          );

        // 3. Inject ma trận vào R3F camera
        camera.projectionMatrix.copy(m.multiply(l));
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

        // Reset world matrices vì chúng đã được tính gộp trong projectionMatrix
        camera.matrixWorld.identity();
        camera.matrixWorldInverse.identity();

        // 4. Thủ công kích hoạt render để đảm bảo đồng bộ hoàn hảo theo từng frame của map
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
  return (
    <>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        shadows
        frameloop='never' // Dùng mode "never" để chủ động render theo nhịp của MapLibre
        dpr={[1, 2]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Cho phép tương tác map xuyên qua canvas
        }}
      >
        <CameraSync map={map} centerCoord={centerCoord} />

        <fog attach='fog' args={['#ffffff', 50, 1500]} />

        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 100]} intensity={1.5} />
        <directionalLight position={[-10, -20, 100]} intensity={0.5} />

        {children}
      </Canvas>
    </>
  );
};
