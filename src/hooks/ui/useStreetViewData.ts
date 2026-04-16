import { useState, useMemo, useEffect } from 'react';
import type { StreetviewPoint } from '../../types/streetview_point';

export interface Spot {
  id: string;
  name: string;
  pano: string;
  lon: number;
  lat: number;
  floor: number;
  heading?: number;
  links: PSVLink[];
}

export interface PSVLink {
  nodeId: string;
  gps?: [number, number, number?];
  bearing?: number;
}

export interface PSVNode {
  id: string;
  panorama: string;
  gps: [number, number, number?];
  name: string;
  links: PSVLink[];
  sphereCorrection?: {
    pan?: string | number;
    tilt?: string | number;
    roll?: string | number;
  };
}

// Placeholder for pano URL base if needed
// const BASE_URL = 'https://maps.vgm.ai';
const BASE_PANO_URL = '/panoramas/tour/';

// Hàm tính góc Bearing (Phương vị) từ GPS
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function useStreetViewData() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/streetview_point/streetview_point.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch geojson');
        return res.json();
      })
      .then((data: StreetviewPoint) => {
        const features = data.features || [];
        const transformedSpots: Spot[] = features.map((feat, index: number) => {
          const id = feat.properties.ten || String(index + 1);
          const [lon, lat] = feat.geometry.coordinates;

          // Temporary links: link to previous and next node in the array
          const links: PSVLink[] = [];
          if (index > 0) {
            links.push({
              nodeId: features[index - 1].properties.ten || String(index),
            });
          }
          if (index < features.length - 1) {
            links.push({
              nodeId: features[index + 1].properties.ten || String(index + 2),
            });
          }

          return {
            id,
            name: `Điểm ${id}`,
            pano: `${BASE_PANO_URL}${id}.jpg`,
            lon,
            lat,
            floor: 0,
            links,
          };
        });
        setSpots(transformedSpots);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const psvNodes = useMemo<PSVNode[]>(() => {
    const spotMap = new Map(spots.map((s) => [s.id, s]));

    return spots.map((spot) => {
      let autoPan = 0;

      if (spot.links && spot.links.length > 0) {
        const targetNodeId = spot.links[0].nodeId;
        const targetNode = spotMap.get(targetNodeId);

        if (targetNode) {
          autoPan = getBearing(
            spot.lat,
            spot.lon,
            targetNode.lat,
            targetNode.lon
          );
        }
      }

      // No overrides for now as it's new data
      const finalPan = autoPan % 360;

      return {
        id: spot.id,
        panorama: spot.pano,
        gps: [spot.lon, spot.lat],
        name: spot.name,
        sphereCorrection: { pan: `${Math.round(finalPan)}deg` },
        links: spot.links,
      };
    });
  }, [spots]);

  return { spots, psvNodes, loading, error };
}
