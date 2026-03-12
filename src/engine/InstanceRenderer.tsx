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
  Vector3,
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
  zoom: number;
  onInstanceClick?: (id: string) => void;
}

// Reuse dummy object to avoid GC
const DUMMY = new Object3D();

/**
 * InstanceRenderer: Efficiently renders multiple instances of a GLB model with LOD.
 * LOD switching is handled via the 'zoom' prop passed from ModelManager.
 */
export const InstanceRenderer = ({
  url,
  instances,
  zoom,
  onInstanceClick,
}: InstanceProps) => {
  const { nodes } = useGLTF(url);

  // Extract geometries and materials from GLB
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
    return parts;
  }, [nodes]);

  const glbRefs = useRef<(InstancedMesh | null)[]>([]);
  const boxRef = useRef<InstancedMesh>(null);

  // Synchronize instances with Three.js engine
  useEffect(() => {
    if (instances.length === 0) return;

    if (zoom >= 16) {
      // LOD 0/1: High poly GLB
      instances.forEach((inst, i) => {
        DUMMY.position.copy(inst.position);
        if (inst.rotation) DUMMY.rotation.copy(inst.rotation);
        DUMMY.scale.copy(inst.scale || new Vector3(1, 1, 1));
        DUMMY.updateMatrix();

        glbRefs.current.forEach((mesh) => {
          if (mesh) {
            mesh.setMatrixAt(i, DUMMY.matrix);
          }
        });
      });

      glbRefs.current.forEach((mesh) => {
        if (mesh) {
          mesh.instanceMatrix.needsUpdate = true;
          // note: Compute bounding box and sphere to ensure correct frustum culling
          // This prevents instances from disappearing when the "origin" is off-screen.
          mesh.computeBoundingBox();
          mesh.computeBoundingSphere();
        }
      });
    } else {
      // LOD 2: Simple Bounding Box
      instances.forEach((inst, i) => {
        DUMMY.position.copy(inst.position);
        if (inst.rotation) DUMMY.rotation.copy(inst.rotation);

        // Scale box to be visible but simple
        const s = inst.scale ? inst.scale.x * 10 : 10;
        DUMMY.scale.set(s, s, s);
        DUMMY.updateMatrix();

        if (boxRef.current) boxRef.current.setMatrixAt(i, DUMMY.matrix);
      });

      if (boxRef.current) {
        boxRef.current.instanceMatrix.needsUpdate = true;
        boxRef.current.computeBoundingBox();
        boxRef.current.computeBoundingSphere();
      }
    }
  }, [instances, meshParts, zoom]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined && onInstanceClick) {
      e.stopPropagation();
      onInstanceClick(instances[e.instanceId].id);
    }
  };

  return (
    <group>
      {/* Detail Mode (Zoom 16+) */}
      {zoom >= 16 &&
        meshParts.map((part, index) => (
          <instancedMesh
            key={`${url}-${index}`}
            ref={(el) => {
              glbRefs.current[index] = el;
            }}
            args={[part.geometry, part.material, instances.length]}
            onPointerDown={handlePointerDown}
            frustumCulled={true}
          />
        ))}

      {/* Massing Mode (Zoom < 16) */}
      {zoom < 16 && (
        <instancedMesh
          ref={boxRef}
          args={[undefined, undefined, instances.length]}
          onPointerDown={handlePointerDown}
          frustumCulled={true}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color='#888888' transparent opacity={0.8} />
        </instancedMesh>
      )}
    </group>
  );
};
