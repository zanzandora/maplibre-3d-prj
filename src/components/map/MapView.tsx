/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from 'react';
import Map, { Source, TerrainControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapThreeLayer } from '../map3d/MapThreeLayer';
import { ModelManager } from '../../loader/ModelManager';
import { WGS84_TO_MERCATOR } from '../../utils/coordinate';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { IvoryLayers } from './IvoryLayers';
import {
  MAP_CENTER,
  DEFAULT_VIEW_STATE,
  MAP_BOUNDS_OFFSET,
} from '../../utils/constants';
import { SITES_LIST } from '../../utils/siteList';
import Loading3D from '../Loading3D';
import useLayerVisibility from '../../hooks/map/useLayerVisibility';
import useTerrainLoading from '../../hooks/map/useTerrainLoading';

// note: Limit workers to avoid Main Thread congestion.
maplibregl.setWorkerCount(
  Math.min(Math.max(window.navigator.hardwareConcurrency - 1, 2), 4)
);

// note: Request Throttling: Limit parallel image/DEM requests (default is 16).
maplibregl.setMaxParallelImageRequests(10);

/**
 * Main Viewport: MapLibre managed by react-map-gl with R3F Overlay.
 */
const MapView = () => {
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  // note: Phát hiện thiết bị di động để tối ưu tài nguyên (CPU/GPU/Battery)
  const isMobile = useMemo(
    () => /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent),
    []
  );

  const { isTerrainActive, isLoading3D, setIsModelReady } =
    useTerrainLoading(mapInstance);

  useLayerVisibility(mapInstance, isTerrainActive);

  // Center coordinate for relative positioning (Near the sample model).
  const centerCoord = useMemo(
    () => WGS84_TO_MERCATOR(MAP_CENTER.lng, MAP_CENTER.lat, 0),
    []
  );

  /**
   * note: Request Throttling: Prioritize critical tiles and throttle others.
   */
  const transformRequest = useCallback(
    (url: string, resourceType?: string) => {
      if (resourceType === 'Tile') {
        // Ưu tiên nạp Terrain và Vector Source nội bộ để tránh lag render 3D
        if (
          url.includes('terrain') ||
          url.includes('maps.vgm.ai') ||
          url.includes('ekgis.vn')
        ) {
          return { url, priority: 'high' };
        }

        // Tối ưu cho mobile: Nếu URL yêu cầu tile độ phân giải cao (@2x), có thể hạ cấp để tiết kiệm băng thông
        if (isMobile && url.includes('@2x')) {
          return { url: url.replace('@2x', '') };
        }
      }
      return { url };
    },
    [isMobile]
  );

  const onMapLoad = useCallback((e: any) => {
    const map = e.target as MapLibreMap;

    // note: add sprite (MapLibre style: loadImage + addImage)
    const ivorySite = SITES_LIST.find((s) => s.site_id === 10);
    if (ivorySite && ivorySite.sprite) {
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

  const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {isLoading3D && <Loading3D />}

      <Map
        mapLib={maplibregl}
        initialViewState={DEFAULT_VIEW_STATE}
        maxBounds={maxBounds}
        minZoom={12}
        maxZoom={20}
        // note: Using HYBRID_V4 style for a clean, professional aesthetic (less CPU/GPU heavy than OUTDOOR).
        mapStyle={MAPTILER_STYLE_URL}
        onLoad={onMapLoad}
        // note: Giới hạn pitch trên mobile để tránh nạp quá nhiều tile chân trời
        maxPitch={isMobile ? 65 : 75}
        hash={true}
        dragRotate={true}
        keyboard={true}
        fadeDuration={isMobile ? 100 : 300} // Transition nhanh hơn trên mobile
        transformRequest={transformRequest}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ivory Vector Source and its Layers */}
        <IvoryLayers show3D={isTerrainActive} />

        {mapInstance && (
          <>
            <MapThreeLayer
              map={mapInstance}
              centerCoord={centerCoord}
              // beforeId='poi_outdoor'
            >
              {/* COMPONENTS 3D VÀ R3F*/}
              <ModelManager
                centerCoord={centerCoord}
                map={mapInstance}
                isVisible={isTerrainActive}
                onLoadComplete={() => setIsModelReady(true)}
              />
            </MapThreeLayer>

            {/* Terrain Layer*/}
            <Source
              id='maptiler-terrain'
              type='raster-dem'
              // note: url prop dành cho link chứa metadata (JSON)
              // note: tiles prop chứa Tile Template (chứa {z}/{x}/{y})
              // url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${
              //   import.meta.env.VITE_MAPTILER_API_KEY
              // }`}
              tiles={[
                `https://api.ekgis.vn/v2/maps/terrain/{z}/{x}/{y}.png?api_key=DYZSHsEqJFc58MaBhYHI9zmMMmmPn3Xg9NXSrf0V`,
              ]}
              // note: Giới hạn nạp DEM Tile chỉ trong khu vực maxBounds của dự án
              bounds={[
                maxBounds[0][0],
                maxBounds[0][1],
                maxBounds[1][0],
                maxBounds[1][1],
              ]}
              tileSize={256}
              maxzoom={12}
              volatile={true}
            />

            <TerrainControl source='maptiler-terrain' />
          </>
        )}
      </Map>
    </div>
  );
};

export default MapView;
