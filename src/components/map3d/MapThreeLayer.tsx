import { useEffect, useMemo, useRef } from 'react';
import { type CustomLayerInterface, type Map } from 'maplibre-gl';
import {
  Mesh,
  InstancedMesh,
  BoxGeometry,
  MeshStandardMaterial,
  Matrix4,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  Group,
  DirectionalLight,
} from 'three';
import { createRoot, extend, useThree } from '@react-three/fiber';
import { Lights } from './Lights';
import type { AdvanceFn, R3FRoot } from '../../utils/types';

// extend(THREE as any);
extend({
  Mesh,
  InstancedMesh,
  BoxGeometry,
  MeshStandardMaterial,
  AmbientLight,
  Group,
  DirectionalLight,
});
interface MapThreeLayerProps {
  map: Map;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
  children: React.ReactNode;
  layerId?: string;
  beforeId?: string; // ID của layer mà 3D Layer sẽ chèn vào DƯỚI nó (ví dụ: chèn dưới layer 'poi_outdoor')
}

const MAP_MATRIX = new Matrix4();

/**
 *  todo: Help MapLibre pull Three.js to run alongside it.
 */
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
 * todo: Help Three.js wake up MapLibre when new data is received..
 */
const InvalidateSync = ({ map }: { map: Map }) => {
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);

  useEffect(() => {
    const originalInvalidate = get().invalidate;

    // Ghi đè hàm invalidate trong store của R3F
    set({
      invalidate: () => {
        map.triggerRepaint(); // Ép MapLibre vẽ lại
        originalInvalidate(); // Vẫn gọi hàm invalidate gốc của R3F
      },
    });
  }, [map, set, get]);

  return null;
};

/**
 * todo: Custom 3D Layer: "Ký sinh" R3F vào WebGL Context của MapLibre.
 */
export const MapThreeLayer = ({
  map,
  centerCoord,
  children,
  layerId = 'map-three-layer',
  beforeId,
}: MapThreeLayerProps) => {
  const rootRef = useRef<R3FRoot | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const advanceRef = useRef<AdvanceFn | null>(null);

  // note: Đóng băng World Matrix để tránh tính toán lại mỗi frame
  const worldMatrix = useMemo(() => {
    const m = new Matrix4();
    const s = centerCoord.meterScale;
    m.set(
      s,
      0,
      0,
      centerCoord.x,
      0,
      0,
      s,
      centerCoord.y,
      0,
      s,
      0,
      centerCoord.z,
      0,
      0,
      0,
      1
    );
    return m;
  }, [centerCoord]);

  // Đồng bộ hóa việc cập nhật children
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.render(
        <group>
          <InvalidateSync map={map} />
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
    const customLayer: CustomLayerInterface = {
      id: layerId,
      type: 'custom',
      renderingMode: '3d',

      onAdd: function (mapInstance, gl) {
        const canvas = mapInstance.getCanvas();

        // 1. Khởi tạo WebGLRenderer sử dụng chung Canvas và WebGLContext của MapLibre
        if (!canvas.__r3fSetup) {
          const renderer = new WebGLRenderer({
            canvas: canvas,
            context: gl,
            antialias: true,
            alpha: true,
          });

          // !QUAN TRỌNG: Không được clear depth buffer, nếu không model sẽ luôn nằm đè lên mọi thứ!
          renderer.autoClear = false;
          rendererRef.current = renderer;

          // 2. Khởi tạo Scene và Camera
          const scene = new Scene();
          sceneRef.current = scene;

          const camera = new PerspectiveCamera(28, 1, 0.01, 1e6);
          camera.matrixAutoUpdate = false;
          cameraRef.current = camera;

          const root = createRoot(canvas);
          rootRef.current = root;

          root.configure({
            gl: renderer,
            camera: camera,
            scene: scene,
            frameloop: 'never', // Frame sẽ được đẩy thủ công bên trong hàm `render` của maplibre
            events: () => ({
              // note: true when (hover/click) on 3D models
              enabled: false,
              priority: 0,
              connect: () => {},
              disconnect: () => {},
            }),
            size: {
              top: 0,
              left: 0,
              width: canvas.clientWidth,
              height: canvas.clientHeight,
            },
            dpr: [1, Math.min(window.devicePixelRatio, 2)],
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
      },

      render: function (gl, matrix) {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return;

        // note: Trích xuất ma trận nhanh hơn
        const m = matrix.defaultProjectionData
          ? matrix.defaultProjectionData.mainMatrix
          : matrix;
        MAP_MATRIX.fromArray(m as number[]);

        // note: Kết hợp ma trận thế giới đã được đóng băng
        camera.projectionMatrix.copy(MAP_MATRIX).multiply(worldMatrix);

        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        renderer.resetState();

        if (advanceRef.current) {
          advanceRef.current(performance.now() / 1000, true);
        }
      },

      onRemove: function () {
        /*
          note: Tại sao không dispose renderer ở đây?
          Renderer và Root được cache trên HTMLCanvasElement (__r3fSetup) để tái sử dụng.
          Việc dispose ở đây sẽ làm hỏng cache và gây lỗi khi người dùng toggle layer.
          Chúng ta chỉ dọn dẹp model 3D khỏi scene bằng cách render một fragment rỗng.
        */
        if (rootRef.current) {
          rootRef.current.render(<></>);
        }

        rendererRef.current = null;
        cameraRef.current = null;
        sceneRef.current = null;
        advanceRef.current = null;
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
