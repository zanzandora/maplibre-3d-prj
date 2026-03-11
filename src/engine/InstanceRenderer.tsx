import { useRef, useMemo, useEffect, useState } from 'react';
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
import maplibregl from 'maplibre-gl';

interface InstanceData {
  id: string;
  position: Vector3;
  rotation?: Euler;
  scale?: Vector3;
}

interface InstanceProps {
  url: string;
  instances: InstanceData[];
  map?: maplibregl.Map;
  onInstanceClick?: (id: string) => void;
}

/**
 * Optimized renderer for multiple instances of a GLB model with Zoom-based LOD.
 */
export const InstanceRenderer = ({
  url,
  instances,
  map,
  onInstanceClick,
}: InstanceProps) => {
  const { nodes } = useGLTF(url);
  const [zoom, setZoom] = useState(map?.getZoom() || 17);

  // Sync zoom from MapLibre
  useEffect(() => {
    if (!map) return;
    const updateZoom = () => setZoom(map.getZoom());
    map.on('zoom', updateZoom);
    return () => {
      map.off('zoom', updateZoom);
    };
  }, [map]);

  // note: LOD 0 & 1 - GLB Meshes
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

  // note: Update instance matrices for GLB parts
  useEffect(() => {
    if (zoom < 16) return; // Skip GLB update if in LOD 2

    const dummy = new Object3D();

    instances.forEach((inst, i) => {
      dummy.position.copy(inst.position);
      if (inst.rotation) dummy.rotation.copy(inst.rotation);
      if (inst.scale) dummy.scale.copy(inst.scale);
      else dummy.scale.set(1, 1, 1);

      dummy.updateMatrix();

      glbRefs.current.forEach((mesh) => {
        if (mesh) mesh.setMatrixAt(i, dummy.matrix);
      });
    });

    glbRefs.current.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [instances, meshParts, zoom]);

  // note: Update instance matrices for LOD 2 (Box)
  useEffect(() => {
    if (zoom >= 16) return; // Skip Box update if in LOD 0/1

    const dummy = new Object3D();
    instances.forEach((inst, i) => {
      dummy.position.copy(inst.position);
      // Box just needs position, maybe Y-rotation if needed
      if (inst.rotation) dummy.rotation.copy(inst.rotation);

      // Scale box to a generic building size if not specified
      const s = inst.scale ? inst.scale.x * 10 : 10;
      dummy.scale.set(s, s, s);

      dummy.updateMatrix();
      if (boxRef.current) boxRef.current.setMatrixAt(i, dummy.matrix);
    });

    if (boxRef.current) boxRef.current.instanceMatrix.needsUpdate = true;
  }, [instances, zoom]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined && onInstanceClick) {
      e.stopPropagation();
      const instanceId = instances[e.instanceId].id;
      onInstanceClick(instanceId);
    }
  };

  return (
    <group>
      {/* LOD 0 & 1: Detailed GLB Model */}
      {zoom >= 16 &&
        meshParts.map((part, index) => (
          <instancedMesh
            key={index}
            ref={(el) => (glbRefs.current[index] = el)}
            args={[part.geometry, part.material, instances.length]}
            onPointerDown={handlePointerDown}
            frustumCulled={true}
          />
        ))}

      {/* LOD 2: Bounding Box (Massing) */}
      {zoom < 16 && (
        <instancedMesh
          ref={boxRef}
          args={[undefined, undefined, instances.length]}
          onPointerDown={handlePointerDown}
          frustumCulled={true}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color='#888888' />
        </instancedMesh>
      )}
    </group>
  );
};
