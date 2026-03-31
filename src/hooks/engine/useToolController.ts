import { useEffect } from 'react';
import * as OBC from '@thatopen/components';
import { Highlighter } from '@thatopen/components-front';
import { useBIMStore } from '../../store/useBIMStore';
import { setupHighlighter } from '../../components/engine/Highlighter';
import { setupClipper } from '../../components/engine/Clipper';
import { setupMeasure } from '../../components/engine/Measure';
import type { BIMWorld } from '../../context/bim/BIMProvider';

interface ToolControllerProps {
  components: OBC.Components | null;
  world: BIMWorld | null;
  fragments: OBC.FragmentsManager | null;
  container: HTMLElement | null;
  isReady: boolean;
}

export const useToolController = ({
  components,
  world,
  fragments,
  container,
  isReady,
}: ToolControllerProps) => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const activeSubTools = useBIMStore((s) => s.activeSubTools);

  const setSelectedElement = useBIMStore((s) => s.setSelectedElement);
  const setSelectedNodeId = useBIMStore((s) => s.setSelectedNodeId);
  const setIsHighlighting = useBIMStore((s) => s.setIsHighlighting);

  const measureUnit = useBIMStore((s) => s.measureUnit);
  const measurePrecision = useBIMStore((s) => s.measurePrecision);

  useEffect(() => {
    // Chỉ chạy khi engine đã khởi tạo xong
    if (!isReady || !components || !world || !container || !fragments) return;

    const clipper = components.get(OBC.Clipper);
    const highlighter = components.get(Highlighter);

    let cleanup: (() => void) | undefined;

    switch (activeTool) {
      case 'select':
        cleanup = setupHighlighter(
          highlighter,
          world,
          fragments,
          setSelectedElement,
          setIsHighlighting,
          setSelectedNodeId
        );
        break;
      case 'clip':
        cleanup = setupClipper(clipper, world, container);
        break;
      case 'measure': {
        const subTool = activeSubTools['measure'];
        cleanup = setupMeasure(
          components,
          world,
          container,
          subTool,
          fragments,
          measureUnit,
          measurePrecision
        );
        break;
      }
      default:
        // Tắt các tool đặc thù khi không kích hoạt
        clipper.enabled = false;
        clipper.visible = false;
        break;
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [
    isReady,
    components,
    world,
    fragments,
    container,
    activeTool,
    activeSubTools,
    setSelectedElement,
    setSelectedNodeId,
    setIsHighlighting,
    measureUnit,
    measurePrecision,
  ]);
};
