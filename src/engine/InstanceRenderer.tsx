import { useMemo } from 'react';
import { GLBLoader } from '../loader/GLBLoader';
import type { InstanceData } from '../utils/types';

interface InstanceProps {
  url: string;
  instances: InstanceData[];
  zoom?: number;
  selectedId?: string | null;
}

/**
 * Direct GLB Model Renderer using scene clones per JSON position.
 * Why: Renders original GLB scene clones directly via R3F <primitive object={clonedScene} />.
 * Preserves 100% of original GLB materials, textures, shaders, and node hierarchy.
 */
export const InstanceRenderer = ({ url, instances }: InstanceProps) => {
  const { scene } = GLBLoader.useLoad(url);

  // Clone original GLB scene for each instance position defined in JSON
  const clonedInstances = useMemo(() => {
    return instances.map((inst) => ({
      ...inst,
      clonedScene: scene.clone(true),
    }));
  }, [scene, instances]);

  return (
    <group>
      {clonedInstances.map((inst) => (
        <group
          key={inst.id}
          position={inst.position}
          rotation={inst.rotation}
          scale={inst.scale}
        >
          <primitive object={inst.clonedScene} />
          {/* Visual XYZ Axes Helper: Red = X, Green = Y, Blue = Z */}
          <axesHelper args={[20]} />
        </group>
      ))}
    </group>
  );
};
