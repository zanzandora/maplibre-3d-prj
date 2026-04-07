import { Map } from 'maplibre-gl';
import { API_BASE_URL } from '../../utils/constants';

interface Site {
  schema?: string;
}

/**
 * Add building models to the map using MapLibre's native 'model' layer type.
 * Note: This is an alternative to the R3F-based ModelManager.
 */
export async function addBuildingModels(map: Map, currentSite: Site) {
  try {
    const siteParam = currentSite.schema || 'ekgis';
    const requestUrl = `${API_BASE_URL}/api/map3d?site=${siteParam}`;

    const response = await fetch(requestUrl);
    const buildings = await response.json();

    if (!Array.isArray(buildings) || buildings.length === 0) {
      console.warn('⚠️ Không có dữ liệu model.');
      return;
    }

    let i = 0;
    for (const b of buildings) {
      if (!b.file || !b.name) continue;

      const safeName = b.name.replace(/[^a-zA-Z0-9-_]/g, '_');
      const modelId = `model-${safeName}`;
      const sourceId = `source-${safeName}-${i}`;
      const layerId = `layer-${safeName}-${i++}`;

      let modelUrl = b.file;
      if (!modelUrl.startsWith('http')) {
        const cleanPath = modelUrl.startsWith('/')
          ? modelUrl.slice(1)
          : modelUrl;
        modelUrl = `${API_BASE_URL}/map3d/${currentSite.schema}/${cleanPath}`;
      }

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [b.lng, b.lat, b.height || 0],
            },
            properties: {
              modelId: modelId,
            },
          },
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'model',
          source: sourceId,
          layout: {
            'model-id': modelUrl, // Use the resolved modelUrl
          },
          paint: {
            'model-scale': [b.scale || 1, b.scale || 1, b.scale || 1],
            'model-rotation': [b.pitch || 0, b.yaw || 0, b.roll || 0],
            'model-cast-shadows': true,
            'model-emissive-strength': 0.5,
          },
        } as any);
      }
    }
  } catch (error) {
    console.error('❌ Lỗi load 3D API:', error);
  }
}
