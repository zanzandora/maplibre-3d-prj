import { useState, useMemo, useCallback } from 'react';
import {
  GeolocateControl,
  Map,
  NavigationControl,
} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { ModelManager } from '../../loader/ModelManager';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';

/**
 * Main Viewport: MapLibre managed by react-map-gl with R3F Overlay.
 */
export const MapView = () => {
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Center coordinate for relative positioning (Near the sample model).
  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(105.464649, 20.90334, 0),
    []
  );

  const onMapLoad = useCallback((e: { target: maplibregl.Map }) => {
    setMapInstance(e.target);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map
        initialViewState={{
          longitude: 105.464649,
          latitude: 20.90334,
          zoom: 18,
          pitch: 45,
        }}
        mapStyle='https://tiles.openfreemap.org/styles/liberty'
        onLoad={onMapLoad}
        // antialias={true}
        style={{ width: '100%', height: '100%' }}
      >
        {mapInstance && (
          <MapThreeLayer map={mapInstance} centerCoord={centerCoord}>
            {/* All 3D Content goes here, synchronized with MapLibre */}
            <ModelManager centerCoord={centerCoord} />
          </MapThreeLayer>
        )}

        <NavigationControl />
        <GeolocateControl />
      </Map>
    </div>
  );
};
