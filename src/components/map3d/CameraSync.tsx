/* eslint-disable react-hooks/immutability */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import maplibregl from 'maplibre-gl';
import { Matrix4 } from 'three';

interface CameraSyncProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number };
}

/**

 * Synchronize the Three.js camera with the MapLibre camera using a Custom Layer.

 * This implementation forces Three.js to use MapLibre's projection-view matrix directly,

 * ensuring zero latency and high performance without per-model matrix overhead.

 */

export const CameraSync = ({ map, centerCoord }: CameraSyncProps) => {
  const { camera } = useThree();

  useEffect(() => {
    const cam = camera;
    // Disable Three.js internal matrix calculations to use MapLibre's matrix directly

    cam.matrixAutoUpdate = false;

    const layerId = 'r3f-sync-layer';

    const customLayer: maplibregl.CustomLayerInterface = {
      id: layerId,
      type: 'custom',
      render: (_gl, options) => {
        // In MapLibre v5+, the second parameter is an object containing the matrices
        const matrix = options.modelViewProjectionMatrix;

        // 1. Create the offset matrix (Relative-to-Center) to prevent jittering
        const offsetMatrix = new Matrix4().makeTranslation(
          centerCoord.x,
          centerCoord.y,
          centerCoord.z
        );

        // 2. Combine MapLibre's View-Projection matrix with our offset
        const m4v = new Matrix4().fromArray(matrix);

        // Final Matrix = MapLibreMatrix * OffsetMatrix

        // This allows us to use standard coordinates (meters/relative) in Three.js

        const finalMatrix = m4v.multiply(offsetMatrix);

        // 3. Force apply to Three.js cam

        cam.projectionMatrix.copy(finalMatrix);

        cam.projectionMatrixInverse.copy(finalMatrix).invert();

        // Ensure the View Matrix is Identity because it's already baked into the projectionMatrix

        cam.matrixWorld.identity();

        cam.matrixWorldInverse.identity();
      },
    };

    if (!map.getLayer(layerId)) {
      map.addLayer(customLayer);
    }

    // Force MapLibre to call render() every frame if R3F needs it

    const onRender = () => map.triggerRepaint();

    map.on('render', onRender);

    return () => {
      map.off('render', onRender);

      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    };
  }, [map, camera, centerCoord]);

  return null;
};
