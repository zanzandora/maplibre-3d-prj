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
import {
  MAP_CENTER,
  DEFAULT_VIEW_STATE,
  MAP_BOUNDS_OFFSET,
} from '../../utils/constants';

/**
 * Main Viewport: MapLibre managed by react-map-gl with R3F Overlay.
 */
export const MapView = () => {
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Center coordinate for relative positioning (Near the sample model).
  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(MAP_CENTER.lng, MAP_CENTER.lat, 0),
    []
  );

  const onMapLoad = useCallback((e: { target: maplibregl.Map }) => {
    const map = e.target;
    setMapInstance(map);
  }, []);

  // Calculate bounds: ~1km around center
  const maxBounds = useMemo(() => {
    const { lng, lat } = MAP_CENTER;
    const offset = MAP_BOUNDS_OFFSET;
    return [
      [lng - offset, lat - offset], // Southwest
      [lng + offset, lat + offset], // Northeast
    ] as [[number, number], [number, number]];
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map
        initialViewState={DEFAULT_VIEW_STATE}
        // maxBounds={maxBounds}
        mapStyle='https://tiles.openfreemap.org/styles/liberty'
        onLoad={onMapLoad}
        maxPitch={85}
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
