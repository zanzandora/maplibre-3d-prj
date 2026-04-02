import { useState, useEffect, useMemo } from 'react';

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

export interface StreetViewDataResponse {
  spots: Spot[];
}

const BASE_URL = 'https://maps.vgm.ai';
const API_URL = 'https://maps.vgm.ai/api/images360?site=hlu&floor=T1';

export function useStreetViewData() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch street view data');
        }
        const data: StreetViewDataResponse = await response.json();
        setSpots(data.spots);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('An unknown error occurred')
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const psvNodes = useMemo<PSVNode[]>(() => {
    return spots.map((spot) => ({
      id: spot.id,
      panorama: `${BASE_URL}${spot.pano}`,
      gps: [spot.lon, spot.lat],
      name: spot.name,
      links: spots
        .filter((otherSpot) => otherSpot.id !== spot.id)
        .map((otherSpot) => ({
          nodeId: otherSpot.id,
        })),
    }));
  }, [spots]);

  return { spots, psvNodes, loading, error };
}
