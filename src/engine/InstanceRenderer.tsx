import { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import {
  Object3D,
  type BufferGeometry,
  type Euler,
  type InstancedMesh,
  type Material,
  type Mesh,
  type Vector3,
} from 'three';

interface InstanceProps {
  url: string;
  instances: {
    id: string;
    position: Vector3;
    rotation?: Euler;
    scale?: Vector3;
  }[];
  onInstanceClick?: (id: string) => void;
}

/**
 * Optimized renderer for multiple instances of a GLB model.
 * Uses InstancedMesh for high performance (FPS > 40).
 */
export const InstanceRenderer = ({
  url,
  instances,
  onInstanceClick,
}: InstanceProps) => {
  const { scene } = useGLTF(url);
  const meshRef = useRef<InstancedMesh>(null);

  // Extract geometry and material from GLB.
  // Assumes the GLB has a main mesh.
  const { geometry, material } = useMemo(() => {
    let geo: BufferGeometry | null = null;
    let mat: Material | null = null;

    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        geo = (child as Mesh).geometry;
        mat = (child as Mesh).material as Material;
      }
    });

    if (!geo || !mat)
      throw new Error(
        `Model ${url} does not contain valid geometry or material.`
      );
    return { geometry: geo, material: mat };
  }, [scene, url]);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new Object3D();
    instances.forEach((inst, i) => {
      dummy.position.copy(inst.position);
      if (inst.rotation) dummy.rotation.copy(inst.rotation);
      if (inst.scale) dummy.scale.copy(inst.scale);
      else dummy.scale.set(1, 1, 1);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined && onInstanceClick) {
      e.stopPropagation();
      const instanceId = instances[e.instanceId].id;
      onInstanceClick(instanceId);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      onPointerDown={handlePointerDown}
      frustumCulled={true}
    />
  );
};
