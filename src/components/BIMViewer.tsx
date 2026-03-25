import { useEffect, useRef } from 'react';
import { useBIMContext } from '../context/bim/BIMContext';
import { BIMViewerLayout } from './ui/BIMViewerLayout';
import { generateSpatialTree } from '../utils/generateSpatialTreeJSON';
import { useBIMStore } from './store/useBIMStore';

export default function BIMViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mount, fragments, isReady } = useBIMContext();
  const setSpatialTree = useBIMStore((s) => s.setSpatialTree);
  const setIsTreeLoading = useBIMStore((s) => s.setIsTreeLoading);

  useEffect(() => {
    if (!containerRef.current) return;
    mount(containerRef.current);
  }, [mount]);

  useEffect(() => {
    if (isReady && fragments) {
      const loadFragments = async () => {
        const path = '/school_str.frag';
        const modelId = 'school_str';

        if (fragments.list.has(modelId)) return;

        const file = await fetch(path);
        const buffer = await file.arrayBuffer();
        const model = await fragments.core.load(buffer, { modelId });

        // Start Tree Loading
        setIsTreeLoading(true);
        try {
          const result = await generateSpatialTree(model);
          if (result) {
            setSpatialTree(result.nodes, result.roots);
          }
        } finally {
          setIsTreeLoading(false);
        }
      };
      loadFragments();
    }
  }, [isReady, fragments, setSpatialTree, setIsTreeLoading]);

  return (
    <BIMViewerLayout>
      <div ref={containerRef} className='w-full h-full' />
    </BIMViewerLayout>
  );
}
