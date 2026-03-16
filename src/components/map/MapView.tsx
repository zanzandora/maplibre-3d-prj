/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback, useEffect } from 'react';
import Map, { Source, TerrainControl } from 'react-map-gl/maplibre';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { ModelManager } from '../../loader/ModelManager';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';
import maplibregl, { type ResourceType } from 'maplibre-gl';
import { IvoryLayers } from './IvoryLayers';
import {
  MAP_CENTER,
  DEFAULT_VIEW_STATE,
  MAP_BOUNDS_OFFSET,
  LAYERS_TO_HIDE,
  LAYERS_TO_FORCE_SHOW,
} from '../../utils/constants';
import { SITES_LIST } from '../../utils/siteList';

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
  const [isTerrainActive, setIsTerrainActive] = useState<boolean>(false);

  // Center coordinate for relative positioning (Near the sample model).
  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(MAP_CENTER.lng, MAP_CENTER.lat, 0),
    []
  );

  /**
   * todo: Sync Layer Visibility with Terrain State
   */
  useEffect(() => {
    if (!mapInstance) return;

    const visibilityHide = isTerrainActive ? 'none' : 'visible';
    const visibilityShow = isTerrainActive ? 'visible' : 'none';

    LAYERS_TO_HIDE.forEach((id) => {
      if (mapInstance.getLayer(id)) {
        mapInstance.setLayoutProperty(id, 'visibility', visibilityHide);
      }
    });

    LAYERS_TO_FORCE_SHOW.forEach((id) => {
      if (mapInstance.getLayer(id)) {
        mapInstance.setLayoutProperty(id, 'visibility', visibilityShow);
      }
    });
  }, [isTerrainActive, mapInstance]);

  /**
   * todo: Request Throttling: Prioritize critical tiles and throttle others.
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

    // note: add sprite
    const ivorySite = SITES_LIST.find((s) => s.site_id === 10);
    if (ivorySite && ivorySite.sprite) {
      // Lấy URL sạch (bỏ query param nếu cần, hoặc giữ nguyên)
      const spriteUrl = ivorySite.sprite.split('?')[0];

      map.addSprite('ivory-sprite', spriteUrl);
    }

    // note: Add Sky effect
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

    // map.on('click', 'poi_outdoor', (e) => {
    //   if (e.features && e.features.length > 0) {
    //     const properties = e.features[0].properties;
    //     console.log('Dữ liệu thực tế tại đây:', {
    //       name: properties.name,
    //       category: properties.category,
    //       type: properties.type,
    //     });
    //   }
    // });
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

  // todo:
  useEffect(() => {
    if (!mapInstance) return;

    const handleTerrainChange = () => {
      const terrainState = mapInstance.getTerrain();
      setIsTerrainActive(!!terrainState);
    };

    mapInstance.on('terrain', handleTerrainChange);
    mapInstance.on('styledata', handleTerrainChange);
    handleTerrainChange();

    return () => {
      mapInstance.off('terrain', handleTerrainChange);
      mapInstance.off('styledata', handleTerrainChange);
    };
  }, [mapInstance]);

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
        doubleClickZoom={false}
        fadeDuration={0}
        transformRequest={transformRequest}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ivory Vector Source and its Layers */}
        <IvoryLayers show3D={isTerrainActive} />

        {mapInstance && (
          <MapThreeLayer
            map={mapInstance as unknown as maplibregl.Map}
            centerCoord={centerCoord}
          >
            {/* 3D Content models are visible when terrain is active */}
            <ModelManager
              centerCoord={centerCoord}
              map={mapInstance as unknown as maplibregl.Map}
              isVisible={isTerrainActive}
            />

            <Source
              id='maptiler-terrain'
              type='raster-dem'
              url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${
                import.meta.env.VITE_MAPTILER_API_KEY
              }`}
              tileSize={256}
            />

            <TerrainControl source='maptiler-terrain' />
          </MapThreeLayer>
        )}
      </Map>
    </div>
  );
};

export default MapView;
