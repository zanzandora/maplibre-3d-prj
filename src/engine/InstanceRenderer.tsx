import { useRef, useMemo, useLayoutEffect } from 'react';
import {
  Object3D,
  type BufferGeometry,
  type Euler,
  type InstancedMesh,
  type Material,
  type Mesh,
  Vector3,
  Color,
} from 'three';
import { GLBLoader } from '../loader/GLBLoader';

export interface InstanceData {
  id: string;
  position: Vector3;
  rotation?: Euler;
  scale?: Vector3;
}

interface InstanceProps {
  url: string;
  instances: InstanceData[];
  zoom: number;
  selectedId?: string | null;
}

// Reuse dummy object to avoid GC
const DUMMY = new Object3D();
const DEFAULT_COLOR = new Color('#ffffff');
const HIGHLIGHT_COLOR = new Color('#ffcc00'); // Yellow-gold highlight

/**
 * InstanceRenderer: Efficiently renders multiple instances of a GLB model with LOD.
 * LOD switching is handled via the 'zoom' prop passed from ModelManager.
 */
export const InstanceRenderer = ({
  url,
  instances,
  zoom,
  selectedId,
}: InstanceProps) => {
  const { nodes } = GLBLoader.useLoad(url);

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

  // 1. Sync Matrices & Initial Colors (Runs on data/zoom change)
  useLayoutEffect(() => {
    if (instances.length === 0) return;

    if (zoom >= 16) {
      // LOD 0/1: High poly GLB
      instances.forEach((inst, i) => {
        DUMMY.position.copy(inst.position);
        if (inst.rotation) DUMMY.rotation.copy(inst.rotation);
        DUMMY.scale.copy(inst.scale || new Vector3(1, 1, 1));
        DUMMY.updateMatrix();

        const color = inst.id === selectedId ? HIGHLIGHT_COLOR : DEFAULT_COLOR;

        glbRefs.current.forEach((mesh) => {
          if (mesh) {
            mesh.setMatrixAt(i, DUMMY.matrix);
            mesh.setColorAt(i, color);
          }
        });
      });

      glbRefs.current.forEach((mesh) => {
        if (mesh) {
          mesh.instanceMatrix.needsUpdate = true;
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
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

        const color = inst.id === selectedId ? HIGHLIGHT_COLOR : DEFAULT_COLOR;

        if (boxRef.current) {
          boxRef.current.setMatrixAt(i, DUMMY.matrix);
          boxRef.current.setColorAt(i, color);
        }
      });

      if (boxRef.current) {
        boxRef.current.instanceMatrix.needsUpdate = true;
        if (boxRef.current.instanceColor)
          boxRef.current.instanceColor.needsUpdate = true;
        boxRef.current.computeBoundingBox();
        boxRef.current.computeBoundingSphere();
      }
    }
  }, [instances, meshParts, zoom]);

  // 2. Fast Color Update (Runs immediately on selection change)
  useLayoutEffect(() => {
    if (instances.length === 0) return;

    instances.forEach((inst, i) => {
      const color = inst.id === selectedId ? HIGHLIGHT_COLOR : DEFAULT_COLOR;

      if (zoom >= 16) {
        glbRefs.current.forEach((mesh) => {
          if (mesh) mesh.setColorAt(i, color);
        });
      } else if (boxRef.current) {
        boxRef.current.setColorAt(i, color);
      }
    });

    if (zoom >= 16) {
      glbRefs.current.forEach((mesh) => {
        if (mesh && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      });
    } else if (boxRef.current && boxRef.current.instanceColor) {
      boxRef.current.instanceColor.needsUpdate = true;
    }
  }, [selectedId, instances, zoom]);

  return (
    <group>
      {/* Detail Mode (Zoom 16+) */}
      {zoom >= 16 &&
        meshParts.map((part, index) => (
          <instancedMesh
            key={`${url}-${index}`}
            ref={(el) => {
              glbRefs.current[index] = el;
              if (el) el.userData.instances = instances;
            }}
            args={[part.geometry, part.material, instances.length]}
            frustumCulled={false}
          />
        ))}

      {/* Massing Mode (Zoom < 16) */}
      {zoom < 16 && (
        <instancedMesh
          ref={(el) => {
            boxRef.current = el;
            if (el) el.userData.instances = instances;
          }}
          args={[undefined, undefined, instances.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color='#ffffff' transparent opacity={0.8} />
        </instancedMesh>
      )}
    </group>
  );
};
