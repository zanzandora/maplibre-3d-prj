import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';
import maplibregl from 'maplibre-gl';

interface CameraSyncProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
}

// Pre-allocate objects to avoid GC overhead in the render loop
const PROJECTION_MATRIX = new Matrix4();
const WORLD_MATRIX = new Matrix4();
const SCALE_VECTOR = new Vector3();

/**
 * CameraSync: Synchronizes R3F Camera with MapLibre GL Camera.
 * Injects MapLibre's projection matrix into R3F camera and handles the render loop.
 */
export const CameraSync = ({ map, centerCoord }: CameraSyncProps) => {
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

    // Force MapLibre to repaint on movement to maintain sync
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
