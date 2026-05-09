import { useEffect, Suspense } from 'react';
import { type Map as MapLibreMap } from 'maplibre-gl';
import { Color } from 'three';
import { useThree } from '@react-three/fiber';
import {
  TilesRenderer,
  TilesPlugin,
  TilesAttributionOverlay,
} from '3d-tiles-renderer/r3f';
import {
  TilesFadePlugin,
  UpdateOnChangePlugin,
  DebugTilesPlugin,
  TileCompressionPlugin,
} from '3d-tiles-renderer/plugins';

import { Lights } from './Lights';
import type { AdvanceFn } from '../../utils/types';

// New Hooks
import { useMapCenterTransform } from '../../hooks/3d-tiles/useMapCenterTransform';
import { useTilesetAuth } from '../../hooks/3d-tiles/useTilesetAuth';
import { useTilesCustomLayer } from '../../hooks/3d-tiles/useTilesCustomLayer';

interface Tiles3DLayerProps {
  map?: MapLibreMap;
  centerCoord?: { x: number; y: number; z: number; meterScale: number };
  assetId: string;
  ionToken: string;
  layerId?: string;
  beforeId?: string;
  onLoad?: () => void;
  enabled?: boolean;
}

const AdvanceCapturer = ({
  advanceRef,
}: {
  advanceRef: React.RefObject<AdvanceFn | null>;
}) => {
  const advance = useThree((state) => state.advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance, advanceRef]);
  return null;
};

const InvalidateSync = ({ map }: { map: MapLibreMap }) => {
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  useEffect(() => {
    const originalInvalidate = get().invalidate;
    set({
      invalidate: () => {
        map.triggerRepaint();
        originalInvalidate();
      },
    });
  }, [map, set, get]);
  return null;
};

/**
 * Core R3F Component for Tileset.
 */
export const TilesetContent = ({
  assetId,
  ionToken,
  onLoad,
}: {
  assetId: string;
  ionToken: string;
  onLoad?: () => void;
}) => {
  const { url, fetchOptions, handleLoad } = useTilesetAuth({
    assetId,
    ionToken,
    onLoad,
  });
  const { position, quaternion, scale } = useMapCenterTransform();

  if (!url) return null;

  return (
    <Suspense fallback={null}>
      <group position={position} quaternion={quaternion} scale={scale}>
        <TilesRenderer
          key={`${assetId}-${ionToken}`}
          url={url}
          fetchOptions={fetchOptions}
          onLoadTileset={handleLoad}
        >
          <TilesPlugin plugin={TileCompressionPlugin} />
          <TilesPlugin plugin={TilesFadePlugin} fadeDuration={500} />
          <TilesPlugin plugin={UpdateOnChangePlugin} />
          <TilesPlugin
            plugin={DebugTilesPlugin}
            displayBoxBounds={false}
            displaySphereBounds={true}
            displayRegionBounds={true}
            regionColor={new Color(0x00ff00)}
            sphereColor={new Color(0xff0000)}
          />
          <TilesAttributionOverlay />
        </TilesRenderer>
      </group>
    </Suspense>
  );
};

/**
 * Smart Wrapper: Standalone Custom Layer OR pure R3F Component.
 */
export const Tiles3DLayer = (props: Tiles3DLayerProps) => {
  const {
    map,
    centerCoord,
    assetId,
    ionToken,
    layerId = 'tiles-3d-layer',
    beforeId,
    onLoad,
    enabled = true,
  } = props;

  let inR3F = false;
  try {
    useThree();
    inR3F = true;
  } catch (e) {
    inR3F = false;
  }

  const { rootRef, advanceRef, isReady } = useTilesCustomLayer({
    map: inR3F ? undefined : map,
    layerId,
    beforeId,
    enabled,
    centerCoord,
  });

  // Render to R3F Root if not already in R3F context
  useEffect(() => {
    if (rootRef.current && isReady && map) {
      rootRef.current.render(
        <group>
          <InvalidateSync map={map} />
          <AdvanceCapturer advanceRef={advanceRef} />
          <Lights />
          {enabled && (
            <TilesetContent
              assetId={assetId}
              ionToken={ionToken}
              onLoad={onLoad}
            />
          )}
        </group>,
      );
      map.triggerRepaint();
    }
  }, [assetId, ionToken, map, onLoad, isReady, enabled, rootRef, advanceRef]);

  if (inR3F) {
    return enabled ? (
      <TilesetContent assetId={assetId} ionToken={ionToken} onLoad={onLoad} />
    ) : null;
  }

  return null;
};
