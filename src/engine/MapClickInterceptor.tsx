import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import maplibregl from 'maplibre-gl';
import type { InstanceData } from '../utils/types';
import { InstancedMesh, Raycaster, Vector2, Vector3 } from 'three';

interface MapClickInterceptorProps {
  map: maplibregl.Map;
  onModelClick?: (modelId: string, modelData: InstanceData) => void;
}

export const MapClickInterceptor = ({
  map,
  onModelClick,
}: MapClickInterceptorProps) => {
  const { camera, scene } = useThree();

  useEffect(() => {
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const onMapClick = (e: maplibregl.MapMouseEvent) => {
      const canvas = map.getCanvas();
      const rect = canvas.getBoundingClientRect();

      // 1. Lấy tọa độ chuột chuẩn (NDC)
      mouse.x = (e.point.x / rect.width) * 2 - 1;
      mouse.y = -(e.point.y / rect.height) * 2 + 1;

      // ==========================================
      // 🚀 THUẬT TOÁN BẮN TIA DÀNH RIÊNG CHO MAPLIBRE
      // ==========================================
      // Tạo điểm đầu (near) và điểm cuối (far) của tia sáng trên không gian 2D
      const near = new Vector3(mouse.x, mouse.y, -1);
      const far = new Vector3(mouse.x, mouse.y, 1);

      // Giải mã ngược bằng projectionMatrixInverse của CameraSync
      near.applyMatrix4(camera.projectionMatrixInverse);
      far.applyMatrix4(camera.projectionMatrixInverse);

      // Tính toán hướng đi chính xác của tia sáng trong không gian 3D
      const direction = far.clone().sub(near).normalize();

      // Setup Raycaster thủ công thay vì dùng setFromCamera
      raycaster.set(near, direction);
      // ==========================================

      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];

        if (
          hit.object instanceof InstancedMesh &&
          hit.instanceId !== undefined
        ) {
          const instanceList: InstanceData[] = hit.object.userData.instances;

          if (instanceList && instanceList[hit.instanceId]) {
            const clickedData = instanceList[hit.instanceId];

            e.originalEvent.stopPropagation(); // Chặn MapLibre nhận click

            console.log(
              `✅ Click chuẩn xác Model:`,
              clickedData.id,
              clickedData
            );

            if (onModelClick) {
              onModelClick(clickedData.id, clickedData);
            }
          }
        }
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, camera, scene, onModelClick]);

  return null;
};
