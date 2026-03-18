import { useEffect } from 'react';
import { LAYERS_TO_FORCE_SHOW, LAYERS_TO_HIDE } from '../../utils/constants';
import { type Map } from '@maptiler/sdk';

/**
 * Automatically synchronize the hiding/showing of 2D layers
 * based on the state of the 3D environment.
 * @param mapInstance
 * @param isTerrainActive
 */
const useLayerVisibility = (
  mapInstance: Map | null,
  isTerrainActive: boolean
) => {
  useEffect(() => {
    if (!mapInstance) return;

    const visibilityHide = isTerrainActive ? 'none' : 'visible';
    const visibilityShow = isTerrainActive ? 'visible' : 'none';

    LAYERS_TO_HIDE.forEach((id) => {
      if (mapInstance.getLayer(id))
        mapInstance.setLayoutProperty(id, 'visibility', visibilityHide);
    });

    LAYERS_TO_FORCE_SHOW.forEach((id) => {
      if (mapInstance.getLayer(id))
        mapInstance.setLayoutProperty(id, 'visibility', visibilityShow);
    });
  }, [isTerrainActive, mapInstance]);
};

export default useLayerVisibility;
