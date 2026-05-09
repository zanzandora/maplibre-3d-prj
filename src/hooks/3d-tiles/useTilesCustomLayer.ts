import { useEffect, useRef, useState, useMemo } from 'react';
import {
  type CustomLayerInterface,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import { Matrix4, WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { createRoot } from '@react-three/fiber';
import type { AdvanceFn, R3FRoot } from '../../utils/types';

interface UseTilesCustomLayerProps {
  map?: MapLibreMap;
  layerId: string;
  beforeId?: string;
  enabled: boolean;
  centerCoord?: { x: number; y: number; z: number; meterScale: number };
}

const MAP_MATRIX = new Matrix4();

/**
 * Hook to manage MapLibre Custom Layer for 3D Tiles rendering.
 */
export const useTilesCustomLayer = ({
  map,
  layerId,
  beforeId,
  enabled,
  centerCoord,
}: UseTilesCustomLayerProps) => {
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

  useEffect(() => {
    if (!map) return;

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
        if (rootRef.current) rootRef.current.render(null);
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
  }, [map, layerId, beforeId, enabled, worldMatrix]);

  return {
    rootRef,
    advanceRef,
    isReady,
  };
};
