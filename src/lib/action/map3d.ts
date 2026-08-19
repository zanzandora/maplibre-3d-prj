import type { ModelData } from '../../utils/types';

interface Site {
  schema?: string;
}

/**
 * Shared logic to fetch and map building model data.
 */
/**
 * Shared logic to fetch building models from local JSON files.
 * Why: Decoupled from external API (maps.vgm.ai) to run fully offline using local GLB models and JSON data.
 */
export async function fetchBuildingModels(
  currentSite: Site
): Promise<ModelData[]> {
  const siteParam = currentSite.schema || 'benhvien175';

  try {
    // Attempt 1: Fetch local buildings.json
    let response = await fetch(`/map3d/${siteParam}/buildings.json`);

    // Attempt 2: Fallback to mautoadogoc1.txt if buildings.json does not exist
    if (!response.ok) {
      response = await fetch(`/map3d/${siteParam}/mautoadogoc1.txt`);
    }

    if (!response.ok) {
      console.warn(`Could not find local building JSON for site: ${siteParam}`);
      return [];
    }

    const buildings = await response.json();

    if (!Array.isArray(buildings)) {
      return [];
    }

    // Map file paths to ensure they point to valid local GLB models
    return buildings.map((b) => {
      let modelUrl = b.file;

      // Ensure modelUrl is absolute from origin root
      if (modelUrl && !modelUrl.startsWith('/') && !modelUrl.startsWith('http')) {
        modelUrl = `/map3d/${siteParam}/${modelUrl}`;
      }

      return { ...b, file: modelUrl };
    });
  } catch (error) {
    console.error(`Error loading local building models for ${siteParam}:`, error);
    return [];
  }
}

/**
 * Add building models to the map using MapLibre's native 'model' layer type.
 * Note: This is an alternative to the R3F-based ModelManager.
 */
