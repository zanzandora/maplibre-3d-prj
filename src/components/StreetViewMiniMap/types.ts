import type { Viewer } from '@photo-sphere-viewer/core';

/*
  Data structure for a single panorama node in the tour.
*/
export interface PSVNode {
  id: string;
  gps: [number, number, number?];
  position?: { gps: [number, number, number?] };
}

/*
  Props for the StreetViewMiniMap component.
*/
export interface StreetViewMiniMapProps {
  viewer: Viewer;
  currentLngLat: [number, number];
  nodes: PSVNode[];
  onHotspotClick: (nodeId: string) => void;
  zoom?: number;
  mapStyleUrl?: string;
  coneColor?: string;
}
