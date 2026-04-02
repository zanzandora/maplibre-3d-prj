import { useEffect, useRef } from 'react';
import { useBIMContext } from '../context/bim/BIMContext';
import { BIMViewerLayout } from './ui/BIMViewerLayout';
import { generateSpatialTree } from '../utils';
import { useBIMStore } from '../store/useBIMStore';
import { useViewCube } from '../hooks/engine/useViewCube';
import { InstancedMesh, Mesh } from 'three';

import { useShallow } from 'zustand/react/shallow';
import { memo } from 'react';

const BIMViewer = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mount, fragments, isReady, world, container } = useBIMContext();

  const {
    setSpatialTree,
    setIsTreeLoading,
    currentProjectId,
    projects,
    resetBIMState,
    setIsModelLoading,
  } = useBIMStore(
    useShallow((s) => ({
      setSpatialTree: s.setSpatialTree,
      setIsTreeLoading: s.setIsTreeLoading,
      currentProjectId: s.currentProjectId,
      projects: s.projects,
      resetBIMState: s.resetBIMState,
      setIsModelLoading: s.setIsModelLoading,
    }))
  );

  /*
    Khởi tạo môi trường BIM (Canvas, Scene, Camera) khi component mount.
  */
  useEffect(() => {
    if (!containerRef.current) return;
    mount(containerRef.current);
  }, [mount]);

  /*
    Logic chính để tải và chuyển đổi Model.
    Khi currentProjectId thay đổi, effect này sẽ thực hiện:
    1. Xóa sạch models cũ trong bộ nhớ và Scene.
    2. Reset các state liên quan (Selection, Tree, etc.).
    3. Tải file .frag mới và khởi tạo lại Spatial Tree.
  */
  useEffect(() => {
    if (!isReady || !fragments || !currentProjectId) return;

    const project = projects.find((p) => p.id === currentProjectId);
    if (!project) return;

    const loadFragments = async () => {
      // GPU MEMORY OPTIMIZATION: Deep cleanup of Three.js resources
      if (fragments.list.size > 0) {
        for (const [, group] of fragments.list) {
          if (group.object && world) {
            world.scene.three.remove(group.object);

            // Deep dispose Three.js geometries and materials
            group.object.traverse((child) => {
              if (child instanceof Mesh || child instanceof InstancedMesh) {
                if (child.geometry) {
                  child.geometry.dispose();
                }
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                  } else {
                    child.material.dispose();
                  }
                }
              }
            });
          }
          group.dispose();
        }

        fragments.list.clear();
        fragments.core.update(true);

        // Force the WebGLRenderer to drop any stale state information
        if (world && world.renderer && world.renderer.three) {
          world.renderer.three.renderLists.dispose();
        }
      }

      // Reset UI state trước khi tải model mới
      resetBIMState();

      setIsModelLoading(true);
      setIsTreeLoading(true);

      try {
        const file = await fetch(project.url);
        if (!file.ok) throw new Error(`Failed to fetch model: ${project.url}`);

        const buffer = await file.arrayBuffer();
        const model = await fragments.core.load(buffer, {
          modelId: project.id,
        });

        // Tự động sinh Spatial Tree từ model vừa tải
        const result = await generateSpatialTree(model);
        if (result) {
          setSpatialTree(result.nodes, result.roots);
        }
      } catch (error) {
        console.error('BIMViewer: Error switching project:', error);
      } finally {
        setIsModelLoading(false);
        setIsTreeLoading(false);
      }
    };

    loadFragments();
  }, [
    isReady,
    fragments,
    currentProjectId,
    projects,
    setSpatialTree,
    setIsTreeLoading,
    resetBIMState,
    setIsModelLoading,
    world,
  ]);

  useViewCube(isReady, world, container);

  return (
    <BIMViewerLayout>
      <div ref={containerRef} className='w-full h-full cursor-context-menu' />
    </BIMViewerLayout>
  );
});

BIMViewer.displayName = 'BIMViewer';
export default BIMViewer;
