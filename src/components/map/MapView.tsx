import { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';

/**
 * Main Viewport: MapLibre + R3F Overlay.
 */
export const MapView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  // Center coordinate for relative positioning.
  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(105.8342, 21.0285, 0),
    []
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [105.8342, 21.0285],
      zoom: 16,
      pitch: 45,
      canvasContextAttributes: { antialias: true },
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    return () => mapInstance.remove();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', zIndex: 10 }}
      />
      {map && <MapThreeLayer map={map} centerCoord={centerCoord} />}
    </div>
  );
};
