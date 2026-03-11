import { useState, useMemo, useCallback } from 'react';
import Map from 'react-map-gl/maplibre';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { ModelManager } from '../../loader/ModelManager';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';
import maplibregl from 'maplibre-gl';
import {
  MAP_CENTER,
  DEFAULT_VIEW_STATE,
  MAP_BOUNDS_OFFSET,
} from '../../utils/constants';

// lấy key trong env để cấu hình cho SDK
maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

/**
 * Main Viewport: MapLibre managed by react-map-gl with R3F Overlay.
 * Optimized with MapTiler SDK for simplified 3D terrain.
 */
const MapView = () => {
  const [mapInstance, setMapInstance] = useState<maptilersdk.Map | null>(null);

  // Center coordinate for relative positioning (Near the sample model).
  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(MAP_CENTER.lng, MAP_CENTER.lat, 0),
    []
  );

  const onMapLoad = useCallback((e: any) => {
    const map = e.target as maptilersdk.Map;

    // Ensure terrain source is present.
    // Sometimes the SDK auto-injection is skipped when using react-map-gl wrappers.
    if (!map.getSource('maptiler-terrain')) {
      map.addSource('maptiler-terrain', {
        type: 'raster-dem',
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`,
        tileSize: 256,
      });
    }

    map.setTerrain({
      source: 'maptiler-terrain',
      exaggeration: 1,
    });

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
        mapLib={maptilersdk as any}
        initialViewState={{
          ...DEFAULT_VIEW_STATE,
          pitch: 60, // Increase pitch to better see 3D terrain
        }}
        maxBounds={maxBounds}
        mapStyle={maptilersdk.MapStyle.OUTDOOR_V4}
        onLoad={onMapLoad}
        maxPitch={85}
        hash={true}
        style={{ width: '100%', height: '100%' }}
      >
        {mapInstance && (
          <MapThreeLayer
            map={mapInstance as unknown as maplibregl.Map}
            centerCoord={centerCoord}
          >
            {/* All 3D Content goes here, synchronized with MapLibre */}
            <ModelManager
              centerCoord={centerCoord}
              map={mapInstance as unknown as maplibregl.Map}
            />
          </MapThreeLayer>
        )}
      </Map>
    </div>
  );
};

export default MapView;
