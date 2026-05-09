import { useEffect, useMemo, useRef, Suspense, useState } from 'react';
import {
  type CustomLayerInterface,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import {
  Matrix4,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector3,
  Quaternion,
  Color,
} from 'three';
import { createRoot, useThree } from '@react-three/fiber';
import {
  TilesRenderer,
  TilesPlugin,
  TilesAttributionOverlay,
} from '3d-tiles-renderer/r3f';
import { WGS84_ELLIPSOID } from '3d-tiles-renderer/three';
import {
  TilesFadePlugin,
  UpdateOnChangePlugin,
  DebugTilesPlugin,
  TileCompressionPlugin,
} from '3d-tiles-renderer/plugins';

import { Lights } from './Lights';
import { MAP_CENTER } from '../../utils/constants';
import type { AdvanceFn, R3FRoot } from '../../utils/types';
import { Math as CesiumMath } from 'cesium';

interface Tiles3DLayerProps {
  map?: MapLibreMap; // Optional: Standalone mode
  centerCoord?: { x: number; y: number; z: number; meterScale: number };
  assetId: string;
  ionToken: string;
  layerId?: string;
  beforeId?: string;
  onLoad?: () => void;
  enabled?: boolean;
}

const MAP_MATRIX = new Matrix4();

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

const InvalidateSync = ({ map }: { map: MapLibreMap }) => {
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  useEffect(() => {
    const originalInvalidate = get().invalidate;
    set({
      invalidate: () => {
        map.triggerRepaint();
        originalInvalidate();
      },
    });
  }, [map, set, get]);
  return null;
};

// Hook tính toán ma trận ECEF -> ENU
const useMapCenterTransform = () => {
  const heightOffset = 50; // Độ cao nâng lên so với mặt đất
  return useMemo(() => {
    const latRad = CesiumMath.toRadians(MAP_CENTER.lat);
    const lngRad = CesiumMath.toRadians(MAP_CENTER.lng);

    const matrix = new Matrix4();
    // 1. Tạo ma trận ENU -> ECEF tại tâm bản đồ
    WGS84_ELLIPSOID.getEastNorthUpFrame(latRad, lngRad, 0, matrix);

    // 2. Đảo ngược ma trận thành ECEF -> ENU
    matrix.invert();

    // const mirrorMatrix = new Matrix4().makeScale(-1, 1, 1);
    // // Nhân ma trận đối xứng vào ma trận tổng
    // matrix.multiply(mirrorMatrix);

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();

    // 3. Phân tách ma trận thành các thông số cơ bản cho R3F
    matrix.decompose(position, quaternion, scale);

    // 4. Bù trừ độ cao (dương = nâng lên, âm = hạ xuống)
    position.z += heightOffset;

    return { position, quaternion, scale };
  }, [heightOffset]);
};

/**
 * Core R3F Component for Tileset.
 * Handles Pre-fetch Auth with Header-based security.
 */
export const TilesetContent = ({
  assetId,
  ionToken,
  onLoad,
}: {
  assetId: string;
  ionToken: string;
  onLoad?: () => void;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const loadingResolved = useRef(false);

  const { position, quaternion, scale } = useMapCenterTransform();

  useEffect(() => {
    setUrl(null);
    setToken(null);
    loadingResolved.current = false;
  }, [assetId, ionToken]);

  useEffect(() => {
    if (url || isFetching) return;

    setIsFetching(true);
    console.log(`[Tiles3DLayer] Pre-fetching Auth: ${assetId}`);

    const fetchEndpoint = async () => {
      try {
        const response = await fetch(
          `https://api.cesium.com/v1/assets/${assetId}/endpoint?access_token=${ionToken}`,
        );
        if (!response.ok)
          throw new Error(`Cesium API error: ${response.status}`);
        const data = await response.json();
        if (data) {
          setToken(`Bearer ${data.accessToken}`);
          setUrl(data.url);
          console.log(`[Tiles3DLayer] Auth ready for Headers.`);
        }
      } catch (err) {
        console.error('[Tiles3DLayer] Auth failed:', err);
        setIsFetching(false);
      } finally {
        setIsFetching(false);
      }
    };

    fetchEndpoint();

    const timer = setTimeout(() => {
      if (!loadingResolved.current) {
        if (onLoad) onLoad();
        loadingResolved.current = true;
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
    };
  }, [assetId, ionToken, url, isFetching, onLoad]);

  const fetchOptions = useMemo(() => {
    if (!token) return undefined;
    return {
      headers: { Authorization: token },
    };
  }, [token]);

  const handleLoad = () => {
    if (!loadingResolved.current) {
      if (onLoad) onLoad();
      loadingResolved.current = true;
    }
  };

  if (!url || !token) return null;

  return (
    <Suspense fallback={null}>
      <group position={position} quaternion={quaternion} scale={scale}>
        <TilesRenderer
          key={`${assetId}-${ionToken}`}
          url={url}
          fetchOptions={fetchOptions}
          onLoadTileset={handleLoad}
        >
          <TilesPlugin plugin={TileCompressionPlugin} />
          <TilesPlugin plugin={TilesFadePlugin} fadeDuration={500} />
          <TilesPlugin plugin={UpdateOnChangePlugin} />
          <TilesPlugin
            plugin={DebugTilesPlugin}
            displayBoxBounds={false}
            displaySphereBounds={true} // Sẽ hiển thị một khối cầu bao trọn toàn bộ dự án
            displayRegionBounds={true} // Sẽ hiển thị các khối cong ôm theo mặt đất cho từng công trình
            regionColor={new Color(0x00ff00)} // (Tùy chọn) Đổi màu Region thành xanh lá
            sphereColor={new Color(0xff0000)}
          />
          <TilesAttributionOverlay />
          {/* <TilesetAlignment /> */}
        </TilesRenderer>
      </group>
    </Suspense>
  );
};

/**
 * Smart Wrapper: Standalone Custom Layer OR pure R3F Component.
 */
export const Tiles3DLayer = (props: Tiles3DLayerProps) => {
  const {
    map,
    centerCoord,
    assetId,
    ionToken,
    layerId = 'tiles-3d-layer',
    beforeId,
    onLoad,
    enabled = true,
  } = props;

  let inR3F = false;
  try {
    useThree();
    inR3F = true;
  } catch (e) {
    inR3F = false;
  }

  const rootRef = useRef<R3FRoot | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const advanceRef = useRef<AdvanceFn | null>(null);
  const [isReady, setIsReady] = useState(false);

  const worldMatrix = useMemo(() => {
    if (!centerCoord) return new Matrix4();
    const m = new Matrix4();
    const s = centerCoord.meterScale;

    // Correct Alignment:
    // Mercator Z is Altitude. ENU Z is Up.
    // Mercator Y is South-increasing. ENU Y is North.
    m.set(
      s,
      0,
      0,
      centerCoord.x,
      0,
      s,
      0,
      centerCoord.y,
      0,
      0,
      s,
      centerCoord.z,
      0,
      0,
      0,
      1,
    );
    return m;
  }, [centerCoord]);

  if (inR3F) {
    return enabled ? (
      <TilesetContent assetId={assetId} ionToken={ionToken} onLoad={onLoad} />
    ) : null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (rootRef.current && isReady && map) {
      rootRef.current.render(
        <group>
          <InvalidateSync map={map} />
          <AdvanceCapturer advanceRef={advanceRef} />
          <Lights />
          {enabled && (
            <TilesetContent
              assetId={assetId}
              ionToken={ionToken}
              onLoad={onLoad}
            />
          )}
        </group>,
      );
      map.triggerRepaint();
    }
  }, [assetId, ionToken, map, onLoad, isReady, enabled]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!map || inR3F) return;

    const customLayer: CustomLayerInterface = {
      id: layerId,
      type: 'custom',
      renderingMode: '3d',
      onAdd: function (mapInstance, gl) {
        const canvas = mapInstance.getCanvas() as HTMLCanvasElement;
        if (!canvas.__r3fSetup) {
          const renderer = new WebGLRenderer({
            canvas,
            context: gl,
            antialias: true,
            alpha: true,
          });
          renderer.autoClear = false;
          const scene = new Scene();
          const camera = new PerspectiveCamera(28, 1, 0.01, 1e6);
          camera.matrixAutoUpdate = false;
          const root = createRoot(canvas);
          root.configure({
            gl: renderer,
            camera,
            scene,
            frameloop: 'never',
            size: {
              top: 0,
              left: 0,
              width: canvas.clientWidth,
              height: canvas.clientHeight,
            },
          });
          canvas.__r3fSetup = { renderer, scene, camera, root };
        }
        const setup = canvas.__r3fSetup;
        rendererRef.current = setup.renderer;
        sceneRef.current = setup.scene;
        cameraRef.current = setup.camera;
        rootRef.current = setup.root;
        setIsReady(true);
      },
      render: function (gl, matrix) {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return;
        const m = matrix.defaultProjectionData
          ? matrix.defaultProjectionData.mainMatrix
          : matrix;
        MAP_MATRIX.fromArray(m as number[]);
        camera.projectionMatrix.copy(MAP_MATRIX).multiply(worldMatrix);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        renderer.resetState();
        if (advanceRef.current)
          advanceRef.current(performance.now() / 1000, true);
      },
      onRemove: function () {
        if (rootRef.current) rootRef.current.render(<></>);
        setIsReady(false);
      },
    };

    const addOrRemoveLayer = () => {
      if (enabled) {
        if (!map.getLayer(layerId)) map.addLayer(customLayer, beforeId);
      } else {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      }
    };
    addOrRemoveLayer();
    map.on('styledata', addOrRemoveLayer);
    return () => {
      if (map.getStyle()) {
        map.off('styledata', addOrRemoveLayer);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      }
    };
  }, [map, worldMatrix, layerId, beforeId, assetId, ionToken, inR3F, enabled]);

  return null;
};
