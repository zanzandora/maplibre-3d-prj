export type StreetviewPoint = {
  type: string;
  name: string;
  features: Feature[];
};

export type Feature = {
  type: FeatureType;
  properties: Properties;
  geometry: Geometry;
};

export type Geometry = {
  type: GeometryType;
  coordinates: number[];
};

export type GeometryType = 'Point';

export type Properties = {
  ten: string;
  toaDoX: string;
  toaDoY: string;
  ghiChu: null | string;
};

export type FeatureType = 'Feature';
