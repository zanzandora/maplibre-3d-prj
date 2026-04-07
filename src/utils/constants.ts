import { SITES_LIST } from './siteList';

export const API_BASE_URL = 'https://maps.vgm.ai';

export const MAP_CENTER = {
  lng: SITES_LIST[0].coordinates[0],
  lat: SITES_LIST[0].coordinates[1],
};

export const DEFAULT_VIEW_STATE = {
  longitude: MAP_CENTER.lng,
  latitude: MAP_CENTER.lat,
  zoom: SITES_LIST[0].initialZoom,
  pitch: SITES_LIST[0].initialPitch,
  bearing: SITES_LIST[0].initialBearing,
};

export const MAP_BOUNDS_OFFSET = 0.01; // Roughly 1km

export const MAX_CAPACITY = 1000; // Maximum number of instances allowed in the scene

export const MODEL_HEIGHT_OFFSET = 0.1; // Offset in meters to prevent sinking into terrain

export const LAYERS_TO_HIDE = [
  'congtrinh',
  'congtrinh-label',
  'landmark_label',
  'poi_label',
  'unit_layer',
  'wall_layer',
  'building2D',
  'detailpolygon_layer',
  'poi_outdoor',
  'yard-container-lines',
  'yard_blocks_bound',
  'building_tachtang',
];

export const LAYERS_TO_FORCE_SHOW = [
  'tree-layer',
  'cotdien',
  'diemsang',
  'vachson-ngoaitroi',
  'yard_blocks1',
  'yard_blocks2',
  'yard_blocks3',
  'yard_blocks4',
];
