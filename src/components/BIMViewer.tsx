import { useEffect, useRef } from 'react';
import { useBIMContext } from '../context/BIMContext';

export default function BIMViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mount, fragments, isReady } = useBIMContext();

  useEffect(() => {
    if (!containerRef.current) return;
    mount(containerRef.current);
  }, [mount]);

  useEffect(() => {
    if (isReady && fragments) {
      const loadFragments = async () => {
        const path = '/school_str.frag';
        const modelId = 'school_str';
        const file = await fetch(path);
        const buffer = await file.arrayBuffer();
        await fragments.core.load(buffer, { modelId });
      };
      loadFragments();
    }
  }, [isReady, fragments]);

  return <div ref={containerRef} className='absolute top-0 left-0 h-dvh ' />;
}
