import maplibregl from 'maplibre-gl';
import { Canvas } from '@react-three/fiber';
import { AdaptiveEvents } from '@react-three/drei';
import { CameraSync } from '../../engine/CameraSync';
import { Lights } from './Lights';

interface MapThreeLayerProps {
  map: maplibregl.Map;
  centerCoord: { x: number; y: number; z: number; meterScale: number };
  children: React.ReactNode;
}

/**
 * Hybrid 3D Layer: Renders R3F within an absolute overlay Canvas.
 * Synchronized with MapLibre's camera and frame loop for high-performance 3D WebGIS.
 */
export const MapThreeLayer = ({
  map,
  centerCoord,
  children,
}: MapThreeLayerProps) => {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
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
        pointerEvents: 'none',
      }}
    >
      <CameraSync map={map} centerCoord={centerCoord} />
      <AdaptiveEvents />
      <Lights />
      {children}
    </Canvas>
  );
};
