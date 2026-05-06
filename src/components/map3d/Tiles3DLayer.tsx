import { useEffect, useMemo, useRef, Suspense, useContext } from 'react';
import {
  type CustomLayerInterface,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import { Matrix4, WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { createRoot, useThree } from '@react-three/fiber';
import {
  TilesRenderer,
  TilesPlugin,
  TilesAttributionOverlay,
  TilesRendererContext,
} from '3d-tiles-renderer/r3f';
import { WGS84_ELLIPSOID } from '3d-tiles-renderer/three';
import {
  CesiumIonAuthPlugin,
  DebugTilesPlugin,
} from '3d-tiles-renderer/plugins';
import { Lights } from './Lights';
import { MAP_CENTER } from '../../utils/constants';
import type { AdvanceFn, R3FRoot } from '../../utils/types';

interface Tiles3DLayerProps {
  map: MapLibreMap;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
  assetId: string;
  ionToken: string;
  layerId?: string;
  beforeId?: string;
  onLoad?: () => void;
}

const MAP_MATRIX = new Matrix4();

/**
 * Capture R3F advance function to sync with MapLibre render loop
 */
const AdvanceCapturer = ({
  advanceRef,
}: {
  advanceRef: React.RefObject<AdvanceFn | null>;
}) => {
  const advance = useThree((state) => state.advance);
  useEffect(() => {
    console.log('[Tiles3DLayer] Advance function captured');
    advanceRef.current = advance;
  }, [advance, advanceRef]);
  return null;
};

/**
 * Help Three.js wake up MapLibre when new data is received.
 */
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

/**
 * Aligns the Tileset (ECEF) to the Local ENU frame (MapLibre local meter space).
 * This ensures LOD calculations work correctly and tiles are visible.
 */
const TilesetAlignment = () => {
  const tiles = useContext(TilesRendererContext);

  useEffect(() => {
    if (tiles) {
      console.log('[Tiles3DLayer] Aligning Tileset ECEF to Local ENU surface');
      const matrix = new Matrix4();
      const latRad = MAP_CENTER.lat * (Math.PI / 180);
      const lngRad = MAP_CENTER.lng * (Math.PI / 180);

      // Get matrix that transforms ENU to ECEF
      WGS84_ELLIPSOID.getEastNorthUpFrame(latRad, lngRad, 0, matrix);

      // Invert it to transform ECEF to ENU
      matrix.invert();

      // Apply to the tileset group
      tiles.group.matrix.copy(matrix);
      tiles.group.matrix.decompose(
        tiles.group.position,
        tiles.group.quaternion,
        tiles.group.scale,
      );
      tiles.group.updateMatrixWorld(true);

      console.log('[Tiles3DLayer] Alignment complete');
    }
  }, [tiles]);

  return null;
};

/**
 * Component handling the loading and display of the Tileset using R3F standards.
 */
const TilesetContent = ({
  assetId,
  ionToken,
  onLoad,
}: {
  assetId: string;
  ionToken: string;
  onLoad?: () => void;
}) => {
  const tileCount = useRef(0);
  const loadingResolved = useRef(false);

  useEffect(() => {
    console.log(`[Tiles3DLayer] Initializing Asset ID: ${assetId}`);

    // Safety Timeout: Resolve loading state after 15s if events fail
    const timer = setTimeout(() => {
      if (!loadingResolved.current) {
        console.warn('[Tiles3DLayer] Loading timed out. Forcing resolution.');
        if (onLoad) onLoad();
        loadingResolved.current = true;
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [assetId, onLoad]);

  const handleLoad = () => {
    console.log(`[Tiles3DLayer] Tileset metadata loaded: Asset ${assetId}`);
    if (!loadingResolved.current) {
      if (onLoad) onLoad();
      loadingResolved.current = true;
    }
  };

  const handleTileLoad = () => {
    tileCount.current++;
    if (tileCount.current % 10 === 0) {
      console.log(`[Tiles3DLayer] Tiles loaded: ${tileCount.current}`);
    }
  };

  return (
    <Suspense fallback={null}>
      {/* 
        NOTE: 'load-tileset' core event maps to 'onLoadTileset' prop in R3F wrapper.
      */}
      <TilesRenderer key={`${assetId}-${ionToken}`} onLoadTileset={handleLoad}>
        <TilesPlugin plugin={DebugTilesPlugin} displayBoxBounds={false} />
        <TilesAttributionOverlay />
        <TilesetAlignment />

        <TilesPlugin
          plugin={CesiumIonAuthPlugin}
          args={useMemo(
            () => [
              {
                apiToken: ionToken,
                assetId: assetId,
              },
            ],
            [assetId, ionToken],
          )}
        />
      </TilesRenderer>
    </Suspense>
  );
};

/**
 * Custom 3D Layer for 3D Tiles (OGC).
 * Inherits the "Parasitic R3F" mechanism for perfect camera sync.
 */
export const Tiles3DLayer = ({
  map,
  centerCoord,
  assetId,
  ionToken,
  layerId = 'tiles-3d-layer',
  beforeId,
  onLoad,
}: Tiles3DLayerProps) => {
  const rootRef = useRef<R3FRoot | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const advanceRef = useRef<AdvanceFn | null>(null);

  // 1. World Matrix for coordinate system synchronization
  const worldMatrix = useMemo(() => {
    console.log('[Tiles3DLayer] Computing World Matrix');
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
      1,
    );
    return m;
  }, [centerCoord]);

  // 2. React lifecycle sync with R3F Root
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.render(
        <group>
          {/* <InvalidateSync map={map} />
          <AdvanceCapturer advanceRef={advanceRef} /> */}
          <Lights />
          <TilesetContent
            assetId={assetId}
            ionToken={ionToken}
            onLoad={onLoad}
          />
        </group>,
      );
      map.triggerRepaint();
    }
  }, [assetId, ionToken, map, onLoad]);

  useEffect(() => {
    if (!map) return;

    const customLayer: CustomLayerInterface = {
      id: layerId,
      type: 'custom',
      renderingMode: '3d',

      onAdd: function (mapInstance, gl) {
        console.log(`[Tiles3DLayer] onAdd: ${layerId}`);
        const canvas = mapInstance.getCanvas() as HTMLCanvasElement;

        if (!canvas.__r3fSetup) {
          const renderer = new WebGLRenderer({
            canvas: canvas,
            context: gl,
            antialias: true,
            alpha: true,
          });
          renderer.autoClear = false;
          rendererRef.current = renderer;

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

        if (advanceRef.current) {
          advanceRef.current(performance.now() / 1000, true);
        }
      },

      onRemove: function () {
        console.log(`[Tiles3DLayer] onRemove: ${layerId}`);
        if (rootRef.current) {
          rootRef.current.render(<></>);
        }
      },
    };

    const addLayerToMap = () => {
      if (!map.getLayer(layerId)) {
        map.addLayer(customLayer, beforeId);
      }
    };

    addLayerToMap();
    map.on('styledata', addLayerToMap);

    return () => {
      if (map && map.getStyle && map.getStyle()) {
        map.off('styledata', addLayerToMap);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      }
    };
  }, [map, worldMatrix, layerId, beforeId, assetId, ionToken]);

  return null;
};
