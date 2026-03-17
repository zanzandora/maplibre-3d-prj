/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { createRoot, extend, useThree } from '@react-three/fiber';
import { Lights } from './Lights';
import type { AdvanceFn, R3FRoot } from '../../utils/types';

extend(THREE as any);

interface MapThreeLayerProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
  children: React.ReactNode;
  layerId?: string;
  beforeId?: string; // ID của layer mà 3D Layer sẽ chèn vào DƯỚI nó (ví dụ: chèn dưới layer 'poi_outdoor')
}

const WORLD_MATRIX = new THREE.Matrix4();
const MAP_MATRIX = new THREE.Matrix4();

const AdvanceCapturer = ({
  advanceRef,
}: {
  advanceRef: React.RefObject<AdvanceFn | null>;
}) => {
  const advance = useThree((state) => state.advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance, advanceRef]);
  return null;
};

/**
 * Custom 3D Layer: "Ký sinh" R3F vào WebGL Context của MapLibre.
 * Kỹ thuật này giúp model 3D bị che khuất tự nhiên bởi địa hình (Native Depth Occlusion)
 * và chia sẻ chung một Z-buffer duy nhất.
 */
export const MapThreeLayer = ({
  map,
  centerCoord,
  children,
  layerId = 'map-three-layer',
  beforeId,
}: MapThreeLayerProps) => {
  const rootRef = useRef<R3FRoot | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const advanceRef = useRef<AdvanceFn | null>(null);

  // Đồng bộ hóa việc cập nhật children (React Nodes) vào R3F Root
  // Giúp các model mới thêm vào được render mà không cần khởi tạo lại toàn bộ WebGL.
  useEffect(() => {
    if (rootRef.current && sceneRef.current && cameraRef.current) {
      rootRef.current.render(
        <group>
          <AdvanceCapturer advanceRef={advanceRef} />
          <Lights />
          {children}
        </group>
      );
      map.triggerRepaint();
    }
  }, [children, map]);

  useEffect(() => {
    if (!map) return;

    // Định nghĩa Custom Layer theo chuẩn MapLibre GL JS
    const customLayer: maplibregl.CustomLayerInterface = {
      id: layerId,
      type: 'custom',
      renderingMode: '3d',

      onAdd: function (mapInstance, gl) {
        const canvas = mapInstance.getCanvas();

        // 1. Khởi tạo WebGLRenderer sử dụng chung Canvas và WebGLContext của MapLibre
        if (!canvas.__r3fSetup) {
          const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: gl,
            antialias: true,
            alpha: true,
          });

          // !QUAN TRỌNG: Không được clear depth buffer, nếu không model sẽ luôn nằm đè lên mọi thứ!
          renderer.autoClear = false;
          rendererRef.current = renderer;

          // 2. Khởi tạo Scene và Camera
          const scene = new THREE.Scene();
          sceneRef.current = scene;

          const camera = new THREE.PerspectiveCamera(
            28,
            window.innerWidth / window.innerHeight,
            0.1,
            1e6
          );
          // Vì projection matrix được gán trực tiếp từ MapLibre, vô hiệu hóa tự động cập nhật matrix của ThreeJS.
          camera.matrixAutoUpdate = false;
          cameraRef.current = camera;

          // 3. Khởi tạo R3F Root (Thay thế cho <Canvas />)
          const root = createRoot(mapInstance.getCanvas());
          rootRef.current = root;

          root.configure({
            gl: renderer,
            camera: camera,
            scene: scene,
            frameloop: 'never', // Frame sẽ được đẩy thủ công bên trong hàm `render` của maplibre
            events: () => ({
              // Theo INTERACTION_OPTIMIZATION.md: Tắt event mặc định để tránh Raycaster làm đứng máy
              enabled: false,
              priority: 0,
              connect: () => {},
              disconnect: () => {},
            }),
            size: {
              top: 0,
              left: 0,
              width: mapInstance.getCanvas().clientWidth,
              height: mapInstance.getCanvas().clientHeight,
            },
            // Giới hạn dpr theo chuẩn hiệu năng trong project
            dpr: Math.min(window.devicePixelRatio, 2),
          });

          // Lưu vào Canvas để dùng lại
          canvas.__r3fSetup = { renderer, scene, camera, root };
        }

        // Lấy lại config từ cache
        const setup = canvas.__r3fSetup;
        rendererRef.current = setup.renderer;
        sceneRef.current = setup.scene;
        cameraRef.current = setup.camera;
        rootRef.current = setup.root;

        // Kích hoạt lần render đầu tiên
        setup.root.render(
          <group>
            <AdvanceCapturer advanceRef={advanceRef} />
            <Lights />
            {children}
          </group>
        );
      },

      render: function (_gl, matrix) {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        const root = rootRef.current;

        if (!renderer || !camera || !root) return;

        // Xử lý an toàn cho cấu trúc ma trận của MapLibre v5+
        const matrixArray = (matrix as any).defaultProjectionData
          ? (matrix as any).defaultProjectionData.mainMatrix
          : matrix;

        // Khớp Projection Matrix của camera với bản đồ
        MAP_MATRIX.fromArray(matrixArray);

        const s = centerCoord.meterScale;

        // Xây dựng WORLD_MATRIX thủ công để HOÁN ĐỔI TRỤC Y và Z.
        // Điều này giúp map chính xác không gian Y-up của Three.js vào Z-up của MapLibre
        WORLD_MATRIX.set(
          s,
          0,
          0,
          centerCoord.x, // Three.js X (East)  -> MapLibre X (Longitude)
          0,
          0,
          s,
          centerCoord.y, // Three.js Z (South) -> MapLibre Y (Latitude)
          0,
          s,
          0,
          centerCoord.z, // Three.js Y (Up)    -> MapLibre Z (Altitude)
          0,
          0,
          0,
          1
        );

        // Gộp hai ma trận vào Camera
        camera.projectionMatrix.copy(MAP_MATRIX).multiply(WORLD_MATRIX);

        // Reset trạng thái WebGL trước khi báo R3F vẽ để tránh gây hỏng các layer bản đồ khác
        renderer.resetState();

        // Tiến R3F lên 1 frame - render Scene thủ công đồng bộ với MapLibre frame
        if (advanceRef.current) {
          advanceRef.current(performance.now() / 1000, true);
        } else if (sceneRef.current) {
          // Fallback an toàn: Nếu ở frame đầu tiên AdvanceCapturer chưa kịp set ref,
          // ta chủ động gọi render trực tiếp qua WebGLRenderer của Three.js
          renderer.render(sceneRef.current, camera);
        }
      },

      onRemove: function () {
        // !QUAN TRỌNG: TUYỆT ĐỐI KHÔNG DISPOSE RENDERER Ở ĐÂY!
        // Chỉ dọn dẹp model 3D ra khỏi màn hình bằng cách render component rỗng.
        if (rootRef.current) {
          rootRef.current.render(<></>);
        }

        // Reset refs để chống leak bộ nhớ bên trong Component
        rendererRef.current = null;
        cameraRef.current = null;
        sceneRef.current = null;
        advanceRef.current = null;
        // rootRef giữ nguyên không set null, vì cache vẫn nằm trong thẻ Canvas.
      },
    };

    // Chèn Layer vào Map
    const addLayerToMap = () => {
      if (!map.getLayer(layerId)) {
        map.addLayer(customLayer, beforeId);
      }
    };

    addLayerToMap();

    // Lắng nghe sự kiện styledata để chèn lại layer nếu style bị nạp lại (ví dụ khi bật Terrain)
    map.on('styledata', addLayerToMap);

    // Bắt sự kiện resize để update R3F canvas size
    const onResize = () => {
      if (rootRef.current && map) {
        rootRef.current.configure({
          size: {
            top: 0,
            left: 0,
            width: map.getCanvas().clientWidth,
            height: map.getCanvas().clientHeight,
          },
        });
      }
    };
    map.on('resize', onResize);

    return () => {
      if (map && map.getStyle && map.getStyle()) {
        map.off('styledata', addLayerToMap);
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        map.off('resize', onResize);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, centerCoord]);
  // Chỉ mount lại custom layer nếu reference của map hoặc centerCoord bị thay đổi.

  // Component Custom Layer này KHÔNG render ra bất cứ thẻ HTML nào (như Canvas).
  // Tất cả quá trình render đều diễn ra ngầm trong Context của MapLibre.
  return null;
};
