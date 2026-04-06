import { useState, useMemo } from 'react';
import { datas } from '../../mock/data';

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

const BASE_URL = 'https://maps.vgm.ai';

export function useStreetViewData() {
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const mockSpots: Spot[] = [
    {
      id: 'spot37',
      name: 'spot37',
      pano: '/panoramas/hlu/T1/spot37.jpg',
      lon: 105.8095698,
      lat: 21.021498,
      floor: 0,
      // heading: 230,
      links: [
        {
          nodeId: 'spot26',
        },
        {
          nodeId: 'spot17',
        },
        {
          nodeId: 'spot36',
        },
      ],
    },
    {
      id: 'spot26',
      name: 'spot26',
      pano: '/panoramas/hlu/T1/spot26.jpg',
      lon: 105.809645,
      lat: 21.0216288,
      floor: 0,
      // heading: 230,
      links: [
        {
          nodeId: 'spot37',
        },
      ],
    },
    {
      id: 'spot17',
      name: 'spot17',
      pano: '/panoramas/hlu/T1/spot17.jpg',
      lon: 105.8095155,
      lat: 21.0213724,
      floor: 0,
      // heading: 150,
      links: [
        {
          nodeId: 'spot37',
        },
      ],
    },
    {
      id: 'spot36',
      name: 'spot36',
      pano: '/panoramas/hlu/T1/spot36.jpg',
      lon: 105.8094313,
      lat: 21.0215462,
      floor: 0,
      // heading: 150,
      links: [
        {
          nodeId: 'spot37',
        },
      ],
    },
  ];

  const psvNodes = useMemo<PSVNode[]>(() => {
    return datas.map((spot) => ({
      id: spot.id,
      panorama: `${BASE_URL}${spot.pano}`,
      gps: [spot.lon, spot.lat],
      name: spot.name,
      // sphereCorrection: { pan: `${spot.heading || 0}deg` },
      // links: spot.links.map((link) => {
      //   if ('yaw' in link.position) {
      //     const { yaw, pitch } = flipPosition(
      //       link.position.yaw,
      //       link.position.pitch
      //     );

      //     return {
      //       ...link,
      //       position: { yaw, pitch }, // Trả về vị trí đã được đảo ngược 180 độ
      //     };
      //   }
      //   return link;
      // }),

      links: datas
        .filter((otherSpot) => otherSpot.id !== spot.id)
        .map((otherSpot) => ({
          nodeId: otherSpot.id,
        })),
    }));
  }, []);

  return { spots: datas, psvNodes, loading, error };
}
