import { useEffect, useRef } from 'react';
import { useBIMContext } from '../context/bim/BIMContext';
import { BIMViewerLayout } from './ui/BIMViewerLayout';
import { generateSpatialTree } from '../utils';
import { useBIMStore } from '../store/useBIMStore';
import { useViewCube } from '../hooks/engine/useViewCube';

export default function BIMViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mount, fragments, isReady, world, container } = useBIMContext();

  // State và Actions từ Store
  const setSpatialTree = useBIMStore((s) => s.setSpatialTree);
  const setIsTreeLoading = useBIMStore((s) => s.setIsTreeLoading);

  const currentProjectId = useBIMStore((s) => s.currentProjectId);
  const projects = useBIMStore((s) => s.projects);
  const resetBIMState = useBIMStore((s) => s.resetBIMState);
  const setIsModelLoading = useBIMStore((s) => s.setIsModelLoading);

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
      // Safe cleanup: Xóa models cũ khỏi Scene và bộ nhớ
      if (fragments.list.size > 0) {
        for (const [, group] of fragments.list) {
          // Xóa object 3D khỏi Three.js scene để không để lại rác trên màn hình
          if (group.object && world) {
            world.scene.three.remove(group.object);
          }
          group.dispose();
        }
        // Cập nhật lại core sau khi xóa
        fragments.core.update(true);
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
      <div ref={containerRef} className='w-full h-full' />
    </BIMViewerLayout>
  );
}
