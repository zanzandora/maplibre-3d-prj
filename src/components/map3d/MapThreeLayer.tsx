import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraSync } from './CameraSync';
import { ModelManager } from '../../loader/ModelManager';
import maplibregl from 'maplibre-gl';

interface MapThreeLayerProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number };
}

/**
 * The bridge between MapLibre and R3F.
 * Renders an overlay Canvas and synchronizes the camera.
 */
export const MapThreeLayer = ({ map, centerCoord }: MapThreeLayerProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let map interactions pass through
      }}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: true, // Helps with z-fighting in large scales
        }}
        camera={{ near: 0.1, far: 10000 }} // Sync will override projection
        style={{ pointerEvents: 'auto' }} // Re-enable for 3D object interaction
      >
        <Suspense fallback={null}>
          <CameraSync map={map} centerCoord={centerCoord} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <ModelManager centerCoord={centerCoord} />
        </Suspense>
      </Canvas>
    </div>
  );
};
