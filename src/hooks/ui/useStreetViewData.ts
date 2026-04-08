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

const BASE_URL = 'https://maps.vgm.ai';

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
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const panOverrides: Record<string, number> = {
    // Cổng chính
    spot36: 45,

    // Cửa chính
    spot37: 90,

    // Tòa nhà chính
    spot8: 90,
    spot2: 45,
    spot5: -45,
    spot3: 45,
    spot4: -120,
    spot7: -45,
    spot6: 45,
    spot9: 90,
    spot1: -45,

    // Bãi sân chính
    spot17: -65,
    spot30: 145,
    spot26: 180,

    // hẻm vào ký túc xá
    spot33: 200,
    spot22: 30,
    spot32: 45,
    spot42: 120,
    spot20: 180,

    // Hẻm vào bãi đỗ xe bên phải
    spot29: -65,
    spot23: 45,
    spot40: 45,
    spot13: -45,
    spot38: 220,

    // Hẻm vào bãi đỗ xe bên trái
    spot39: 120,
    spot18: -45,
    spot28: 220,
    spot14: -45,
    spot21: -90,

    // Thư viện
    spot45: -145,
    spot43: -90,
    spot44: -45,
    spot48: 120,
    spot47: 145,
    spot46: 90,

    // sân ký túc xá
    spot41: -90,
    spot27: -45,
    spot12: 45,
  };

  const psvNodes = useMemo<PSVNode[]>(() => {
    const spotMap = new Map(datas.map((s) => [s.id, s]));

    return datas.map((spot) => {
      // 2. Khởi tạo góc Pan mặc định
      let autoPan = 0;

      // 3. Thuật toán Auto-Pan (Line-of-Sight) dựa trên link đầu tiên
      if (spot.links && spot.links.length > 0) {
        const targetNodeId = spot.links[0].nodeId;
        const targetNode = spotMap.get(targetNodeId);

        if (targetNode) {
          // Tự động tính góc phương vị hướng về node tiếp theo
          autoPan = getBearing(
            spot.lat,
            spot.lon,
            targetNode.lat,
            targetNode.lon
          );
        }
      }

      const override = panOverrides[spot.id] || 0;
      const finalPan = (autoPan + override) % 360;

      return {
        id: spot.id,
        panorama: `${BASE_URL}${spot.pano}`,
        gps: [spot.lon, spot.lat],
        name: spot.name,
        // Khớp hướng ảnh với la bàn thực tế
        sphereCorrection: { pan: `${Math.round(finalPan)}deg` },
        links: spot.links,
      };
    });
  }, []);

  return { spots: datas, psvNodes, loading, error };
}
