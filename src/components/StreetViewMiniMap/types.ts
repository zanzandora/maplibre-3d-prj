import type { Viewer } from '@photo-sphere-viewer/core';

export interface PSVNode {
  id: string;
  gps: [number, number, number?];
  position?: { gps: [number, number, number?] };
}

export interface StreetViewMiniMapProps {
  viewer: Viewer;
  currentLngLat: [number, number];
  nodes: PSVNode[];
  onHotspotClick: (nodeId: string) => void;
  zoom?: number;
  mapStyleUrl?: string;
  coneColor?: string;
}
