import { useState, useMemo, useCallback } from 'react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { ModelManager } from '../../loader/ModelManager';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import {
  MAP_CENTER,
  DEFAULT_VIEW_STATE,
  MAP_BOUNDS_OFFSET,
} from '../../utils/constants';
import { SITES_LIST } from '../../utils/siteList';

// Limit workers to avoid Main Thread congestion.
maplibregl.setWorkerCount(
  Math.min(Math.max(window.navigator.hardwareConcurrency - 1, 2), 4),
);

maplibregl.setMaxParallelImageRequests(10);

/**
 * Main Viewport: MapLibre 2D satellite map with 3D model R3F overlay.
 */
const MapView = () => {
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  const isMobile = useMemo(
    () => /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent),
    [],
  );

  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(MAP_CENTER.lng, MAP_CENTER.lat, 0),
    [],
  );

  const transformRequest = useCallback(
    (url: string, resourceType?: string) => {
      if (resourceType === 'Tile') {
        if (isMobile && url.includes('@2x')) {
          return { url: url.replace('@2x', '') };
        }
      }
      return { url };
    },
    [isMobile],
  );

  const onMapLoad = useCallback((e: any) => {
    const map = e.target as MapLibreMap;

    const currentSite = SITES_LIST[0];
    if (currentSite && currentSite.sprite) {
      const spriteUrl = currentSite.sprite.split('?')[0];
      map.addSprite(`${currentSite.schema}-sprite`, spriteUrl);
    }

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

  const maxBounds = useMemo(() => {
    const { lng, lat } = MAP_CENTER;
    const offset = MAP_BOUNDS_OFFSET;
    return [
      [lng - offset, lat - offset],
      [lng + offset, lat + offset],
    ] as [[number, number], [number, number]];
  }, []);

  const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=qsnCKTeh4edupyr3wmzP`;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map
        mapLib={maplibregl}
        initialViewState={DEFAULT_VIEW_STATE}
        maxBounds={maxBounds}
        mapStyle={MAPTILER_STYLE_URL}
        onLoad={onMapLoad}
        maxPitch={isMobile ? 65 : 75}
        hash={true}
        dragRotate={true}
        keyboard={true}
        fadeDuration={isMobile ? 100 : 300}
        transformRequest={transformRequest}
        style={{ width: '100%', height: '100%' }}
      >
        {mapInstance && (
          <MapThreeLayer map={mapInstance} centerCoord={centerCoord}>
            <ModelManager
              centerCoord={centerCoord}
              map={mapInstance}
              isVisible={true}
            />
          </MapThreeLayer>
        )}
      </Map>
    </div>
  );
};

export default MapView;
