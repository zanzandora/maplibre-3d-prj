export const MAP_CENTER = {
  lng: 105.463556,
  lat: 20.901976,
};

export const DEFAULT_VIEW_STATE = {
  longitude: MAP_CENTER.lng,
  latitude: MAP_CENTER.lat,
  zoom: 12,
  pitch: 60,
};

export const MAP_BOUNDS_OFFSET = 0.01; // Roughly 1km

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
