/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from 'react';
import Map from 'react-map-gl/maplibre';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { ModelManager } from '../../loader/ModelManager';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';
import maplibregl, { type ResourceType } from 'maplibre-gl';
import {
  MAP_CENTER,
  DEFAULT_VIEW_STATE,
  MAP_BOUNDS_OFFSET,
} from '../../utils/constants';

// note: Limit workers to avoid Main Thread congestion.
maplibregl.setWorkerCount(
  Math.min(Math.max(window.navigator.hardwareConcurrency - 1, 2), 4)
);

// note: Request Throttling: Limit parallel image/DEM requests (default is 16).
maplibregl.setMaxParallelImageRequests(10);

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

  /**
   * Request Throttling: Prioritize critical tiles and throttle others.
   */
  const transformRequest = useCallback(
    (url: string, resourceType?: ResourceType) => {
      // Priority 1: Terrain/DEM tiles are critical for 3D alignment
      if (resourceType === 'Tile' && url.includes('terrain')) {
        return { url, priority: 'high' };
      }
      // Priority 2: Standard tiles
      return { url };
    },
    []
  );

  const onMapLoad = useCallback((e: any) => {
    const map = e.target as maptilersdk.Map;

    // note: Ensure terrain source is present.
    // note: Sometimes the SDK auto-injection is skipped when using react-map-gl wrappers.
    if (!map.getSource('maptiler-terrain')) {
      map.addSource('maptiler-terrain', {
        type: 'raster-dem',
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`,
        tileSize: 256,
      });
    }

    // note: Set terrain to exaggeration 1.0 for optimal visualization.
    map.setTerrain({
      source: 'maptiler-terrain',
      exaggeration: 1.0,
    });

    // Add Sky effect
    map.setSky({
      'sky-color': '#1990ff',
      'sky-horizon-blend': 0.5,
      'horizon-color': '#ffffff',
      'horizon-fog-blend': 0.5,
      'fog-color': '#ffffff',
      'fog-ground-blend': 0.5,
      'atmosphere-blend': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        1,
        10,
        1,
        12,
        0,
      ],
    });

    setMapInstance(map);
  }, []);

  // todo: Calculate bounds: ~1km around center
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
        initialViewState={DEFAULT_VIEW_STATE}
        maxBounds={maxBounds}
        // note: Using HYBRID_V4 style for a clean, professional aesthetic (less CPU/GPU heavy than OUTDOOR).
        mapStyle={maptilersdk.MapStyle.HYBRID_V4.DEFAULT as any}
        onLoad={onMapLoad}
        maxPitch={85}
        hash={true}
        dragRotate={true}
        touchZoomRotate={true}
        keyboard={true}
        transformRequest={transformRequest}
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
