import { useEffect, useState } from 'react';
import { type Map } from '@maptiler/sdk';

/**
 * Manage the entire 3D data loading lifecycle (Terrain + Model)
 * @param mapInstance
 */
const useTerrainLoading = (mapInstance: Map | null) => {
  const [isTerrainActive, setIsTerrainActive] = useState<boolean>(false);
  const [isLoading3D, setIsLoading3D] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isTerrainReady, setIsTerrainReady] = useState<boolean>(false);

  // Lắng nghe trạng thái Terrain
  useEffect(() => {
    if (!mapInstance) return;

    const handleTerrainChange = () => {
      const isActive = !!mapInstance.getTerrain();
      if (isActive && !isTerrainActive) {
        setIsLoading3D(true);
        setIsModelReady(false);
        setIsTerrainReady(false);
      }
      setIsTerrainActive(isActive);
    };

    const handleMapIdle = () => {
      if (mapInstance.getTerrain()) {
        setIsTerrainReady(true);
      }
    };

    mapInstance.on('terrain', handleTerrainChange);
    mapInstance.on('styledata', handleTerrainChange);
    mapInstance.on('idle', handleMapIdle);

    handleTerrainChange();

    return () => {
      mapInstance.off('terrain', handleTerrainChange);
      mapInstance.off('styledata', handleTerrainChange);
      mapInstance.off('idle', handleMapIdle);
    };
  }, [isTerrainActive, mapInstance]);

  // Khóa Kép: Chỉ tắt Loading khi cả Model và Terrain đều sẵn sàng
  useEffect(() => {
    if (isTerrainActive && isTerrainReady && isModelReady) {
      const timer = setTimeout(() => setIsLoading3D(false), 200); // Flush buffer delay
      return () => clearTimeout(timer);
    }
  }, [isTerrainActive, isTerrainReady, isModelReady]);

  return { isTerrainActive, isLoading3D, setIsModelReady };
};

export default useTerrainLoading;
