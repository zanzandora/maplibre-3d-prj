import { useState, useMemo } from 'react';

export interface Spot {
  id: string;
  name: string;
  pano: string;
  lon: number;
  lat: number;
  floor: number;
}

export interface PSVLink {
  nodeId: string;
}

export interface PSVNode {
  id: string;
  panorama: string;
  gps: [number, number, number?];
  name: string;
  links: PSVLink[];
}

const BASE_URL = 'https://maps.vgm.ai';

export function useStreetViewData() {
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Dữ liệu Mock chuẩn để kiểm tra hướng (37 là tâm, 26 phía Bắc, 17 phía Đông)
  const mockSpots: Spot[] = [
    {
      id: 'spot37',
      name: 'spot37',
      pano: '/panoramas/hlu/T1/spot37.jpg',
      lon: 105.8095698,
      lat: 21.021498,
      floor: 0,
    },
    {
      id: 'spot26',
      name: 'spot26',
      pano: '/panoramas/hlu/T1/spot26.jpg',
      lon: 105.809645,
      lat: 21.0216288,
      floor: 0,
    },
    {
      id: 'spot17',
      name: 'spot17',
      pano: '/panoramas/hlu/T1/spot17.jpg',
      lon: 105.8095155,
      lat: 21.0213724,
      floor: 0,
    },
    {
      id: 'spot36',
      name: 'spot36',
      pano: '/panoramas/hlu/T1/spot36.jpg',
      lon: 105.8094313,
      lat: 21.0215462,
      floor: 0,
    },
  ];

  const psvNodes = useMemo<PSVNode[]>(() => {
    return mockSpots.map((spot) => ({
      id: spot.id,
      panorama: `${BASE_URL}${spot.pano}`,
      gps: [spot.lon, spot.lat],
      name: spot.name,
      links: mockSpots
        .filter((otherSpot) => otherSpot.id !== spot.id)
        .map((otherSpot) => ({
          nodeId: otherSpot.id,
        })),
    }));
  }, []);

  return { spots: mockSpots, psvNodes, loading, error };
}
