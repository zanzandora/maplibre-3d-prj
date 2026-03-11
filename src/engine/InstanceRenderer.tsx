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

interface InstanceData {
  id: string;
  position: Vector3;
  rotation?: Euler;
  scale?: Vector3;
}

interface InstanceProps {
  url: string;
  instances: InstanceData[];
  onInstanceClick?: (id: string) => void;
}

/**
 * Optimized renderer for multiple instances of a GLB model.
 * Handles models with multiple sub-meshes by creating an InstancedMesh for each.
 */
export const InstanceRenderer = ({
  url,
  instances,
  onInstanceClick,
}: InstanceProps) => {
  const { nodes } = useGLTF(url);

  // note: A GLB can have multiple meshes. InstancedMesh only supports ONE geometry/material pair.
  // note: We extract all unique mesh parts to create a corresponding InstancedMesh for each part.
  const meshParts = useMemo(() => {
    const parts: { geometry: BufferGeometry; material: Material }[] = [];

    Object.values(nodes).forEach((node) => {
      if ((node as Mesh).isMesh) {
        const mesh = node as Mesh;
        parts.push({
          geometry: mesh.geometry,
          material: mesh.material as Material,
        });
      }
    });

    if (parts.length === 0) {
      throw new Error(`Model ${url} does not contain any valid geometry.`);
    }

    return parts;
  }, [nodes, url]);

  const refs = useRef<(InstancedMesh | null)[]>([]);

  // note: Update instance matrices for all mesh parts
  useEffect(() => {
    const dummy = new Object3D();

    instances.forEach((inst, i) => {
      dummy.position.copy(inst.position);
      if (inst.rotation) dummy.rotation.copy(inst.rotation);
      if (inst.scale) dummy.scale.copy(inst.scale);
      else dummy.scale.set(1, 1, 1);

      dummy.updateMatrix();

      // Apply the same matrix to every mesh part of the instance
      refs.current.forEach((mesh) => {
        if (mesh) {
          mesh.setMatrixAt(i, dummy.matrix);
        }
      });
    });

    refs.current.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [instances, meshParts]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined && onInstanceClick) {
      e.stopPropagation();
      const instanceId = instances[e.instanceId].id;
      onInstanceClick(instanceId);
    }
  };

  return (
    <group>
      {meshParts.map((part, index) => (
        <instancedMesh
          key={index}
          ref={(el) => (refs.current[index] = el)}
          args={[part.geometry, part.material, instances.length]}
          onPointerDown={handlePointerDown}
          frustumCulled={true}
        />
      ))}
    </group>
  );
};
