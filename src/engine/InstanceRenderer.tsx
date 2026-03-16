import { useRef, useMemo, useLayoutEffect } from 'react';
import {
  Object3D,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
  type Mesh,
  Vector3,
  Color,
} from 'three';
import { GLBLoader } from '../loader/GLBLoader';
import type { InstanceData } from '../utils/types';

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

  // 1. Sync Matrices for both LODs (Only runs when data or model changes)
  useLayoutEffect(() => {
    if (instances.length === 0) return;

    instances.forEach((inst, i) => {
      // Matrix for high-poly GLB
      DUMMY.position.copy(inst.position);
      if (inst.rotation) DUMMY.rotation.copy(inst.rotation);
      DUMMY.scale.copy(inst.scale || new Vector3(1, 1, 1));
      DUMMY.updateMatrix();
      glbRefs.current.forEach((mesh) => mesh?.setMatrixAt(i, DUMMY.matrix));

      // Matrix for low-poly Box (LOD 2)
      const s = inst.scale ? inst.scale.x * 10 : 10;
      DUMMY.scale.set(s, s, s);
      DUMMY.updateMatrix();
      boxRef.current?.setMatrixAt(i, DUMMY.matrix);
    });

    // Notify updates and compute bounding volumes for frustum culling
    glbRefs.current.forEach((mesh) => {
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
    });
    if (boxRef.current) {
      boxRef.current.instanceMatrix.needsUpdate = true;
      boxRef.current.computeBoundingBox();
      boxRef.current.computeBoundingSphere();
    }
  }, [instances, meshParts]);

  // 2. Sync Colors for both LODs (Only runs on selection or data change)
  useLayoutEffect(() => {
    if (instances.length === 0) return;

    instances.forEach((inst, i) => {
      const color = inst.id === selectedId ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
      glbRefs.current.forEach((mesh) => mesh?.setColorAt(i, color));
      boxRef.current?.setColorAt(i, color);
    });

    glbRefs.current.forEach((mesh) => {
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    if (boxRef.current?.instanceColor) {
      boxRef.current.instanceColor.needsUpdate = true;
    }
  }, [selectedId, instances]);

  return (
    <group>
      {/* Detail Mode (Zoom 16+) */}
      <group visible={zoom >= 16}>
        {meshParts.map((part, index) => (
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
      </group>

      {/* Massing Mode (Zoom < 16) */}
      <instancedMesh
        visible={zoom < 16}
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
    </group>
  );
};
