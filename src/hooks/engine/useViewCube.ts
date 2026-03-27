import { useEffect, useRef } from 'react';
import * as BUI from '@thatopen/ui';
import * as OBCUI from '@thatopen/ui-obc';
import { Vector3 } from 'three';
import type { BIMWorld } from '../../context/bim/BIMProvider';
import { useBIMStore } from '../../store/useBIMStore';

BUI.Manager.init();
OBCUI.Manager.init();

export const useViewCube = (
  isReady: boolean,
  world: BIMWorld | null,
  container: HTMLElement | null
) => {
  const viewCubeRef = useRef<any>(null);

  const rightPanelOpen = useBIMStore((s) => s.rightPanelOpen);

  // 1. Initial Creation & Event Listeners
  useEffect(() => {
    if (!isReady || !world || !container) return;

    const viewCube = document.createElement('bim-view-cube') as any;
    viewCubeRef.current = viewCube;

    viewCube.camera = world.camera.three;

    // Static Styles
    viewCube.style.position = 'absolute';
    viewCube.style.width = '60px';
    viewCube.style.height = '60px';
    viewCube.style.zIndex = '50';
    viewCube.style.transition = 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    viewCube.style.top = '96px';

    container.appendChild(viewCube);

    const updateCube = () => viewCube.updateOrientation();
    world.camera.controls?.addEventListener('update', updateCube);

    const handleFaceClick = (
      offsetX: number,
      offsetY: number,
      offsetZ: number
    ) => {
      const controls = world.camera.controls;
      if (!controls) return;

      const target = new Vector3();
      controls.getTarget(target);
      const distance = controls.distance || 50;

      const newPos = new Vector3(
        target.x + offsetX * distance,
        target.y + offsetY * distance,
        target.z + offsetZ * distance
      );

      controls.setLookAt(
        newPos.x,
        newPos.y,
        newPos.z,
        target.x,
        target.y,
        target.z,
        true
      );
    };

    const listeners = {
      frontclick: () => handleFaceClick(0, 0, 1),
      backclick: () => handleFaceClick(0, 0, -1),
      leftclick: () => handleFaceClick(-1, 0, 0),
      rightclick: () => handleFaceClick(1, 0, 0),
      topclick: () => handleFaceClick(0, 1, 0),
      bottomclick: () => handleFaceClick(0, -1, 0),
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      viewCube.addEventListener(event, handler);
    });

    return () => {
      world.camera.controls?.removeEventListener('update', updateCube);
      Object.entries(listeners).forEach(([event, handler]) => {
        viewCube.removeEventListener(event, handler);
      });
      if (container.contains(viewCube)) {
        container.removeChild(viewCube);
      }
      viewCubeRef.current = null;
    };
  }, [isReady, world, container]);

  useEffect(() => {
    if (viewCubeRef.current) {
      viewCubeRef.current.style.right = rightPanelOpen ? '364px' : '30px';
    }
  }, [rightPanelOpen, isReady]);
};
