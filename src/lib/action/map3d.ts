import { Map } from 'maplibre-gl';
import { API_BASE_URL } from '../../utils/constants';
import type { ModelData } from '../../utils/types';

interface Site {
  schema?: string;
}

/**
 * Shared logic to fetch and map building model data.
 */
export async function fetchBuildingModels(
  currentSite: Site
): Promise<ModelData[]> {
  const siteParam = currentSite.schema || 'ekgis';
  const requestUrl = `${API_BASE_URL}/api/map3d?site=${siteParam}`;

  const response = await fetch(requestUrl);
  const buildings = await response.json();

  // console.log(buildings);

  if (!Array.isArray(buildings)) {
    return [];
  }

  return buildings.map((b) => {
    let modelUrl = b.file;
    if (modelUrl && !modelUrl.startsWith('http')) {
      const cleanPath = modelUrl.startsWith('/') ? modelUrl.slice(1) : modelUrl;
      modelUrl = `${API_BASE_URL}/${cleanPath}`;
    }
    return { ...b, file: modelUrl };
  });
}

/**
 * Add building models to the map using MapLibre's native 'model' layer type.
 * Note: This is an alternative to the R3F-based ModelManager.
 */
