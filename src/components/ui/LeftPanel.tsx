import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers2Icon,
} from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import TreeNode from './TreeNode';
import { useBIMContext } from '../../context/bim/BIMContext';
import * as OBC from '@thatopen/components';
import { useCallback, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useFlattenTree } from '../../hooks/ui/useFlattenTree';
import { getAllElementIds } from '../../utils';

export const LeftPanel = () => {
  const leftPanelOpen = useBIMStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useBIMStore((s) => s.toggleLeftPanel);
  const roots = useBIMStore((s) => s.spatialTreeRoots);
  const isTreeLoading = useBIMStore((s) => s.isTreeLoading);

  // Selection & Visibility states
  const selectedNodeId = useBIMStore((s) => s.selectedNodeId);
  const spatialTreeById = useBIMStore((s) => s.spatialTreeById);
  const expandedIds = useBIMStore((s) => s.expandedIds);
  const resetVisibility = useBIMStore((s) => s.resetVisibility);
  const isIsolateMode = useBIMStore((s) => s.isIsolateMode);
  const setIsIsolateMode = useBIMStore((s) => s.setIsIsolateMode);

  const { components, fragments } = useBIMContext();

  const flattenedNodes = useFlattenTree(roots, spatialTreeById, expandedIds);

  /*
    Tạo FragmentIdMap cho node đang được chọn để làm việc với FragmentsHider.
  */
  const getSelectedFragmentsMap = useCallback((): OBC.ModelIdMap | null => {
    if (!selectedNodeId || !fragments) return null;

    const modelId = fragments.list.keys().next().value;
    if (!modelId) return null;

    const elementIds = getAllElementIds(selectedNodeId, spatialTreeById);
    if (elementIds.length === 0) return null;

    return { [modelId]: new Set(elementIds) };
  }, [selectedNodeId, fragments, spatialTreeById]);

  /*
    Thực hiện logic Isolate: Ẩn toàn bộ model và chỉ hiện phần được chọn.
  */
  const executeIsolate = useCallback(() => {
    const fragmentMap = getSelectedFragmentsMap();
    if (!components || !fragmentMap) return;
    const hider = components.get(OBC.Hider);

    hider.set(false); // Ẩn tất cả
    hider.set(true, fragmentMap); // Hiện chỉ vùng chọn
    resetVisibility();
  }, [components, getSelectedFragmentsMap, resetVisibility]);

  /*
    Thực hiện logic Reset: Hiện toàn bộ model.
  */
  const executeShowAll = useCallback(() => {
    if (!components) return;
    const hider = components.get(OBC.Hider);
    hider.set(true); // Hiện tất cả
    resetVisibility();
    setIsIsolateMode(false);
  }, [components, resetVisibility, setIsIsolateMode]);

  /*
    Auto-Isolate logic: Khi người dùng đang ở chế độ Isolate, 
    bất kỳ thay đổi nào về selection sẽ tự động kích hoạt lại Isolate cho đối tượng mới.
  */
  useEffect(() => {
    if (isIsolateMode && selectedNodeId) {
      executeIsolate();
    }
  }, [selectedNodeId, isIsolateMode, executeIsolate]);

  /*
    Xử lý khi nhấn nút Isolate/Reset chính.
  */
  const handleToggleIsolate = () => {
    if (isIsolateMode) {
      executeShowAll();
    } else {
      setIsIsolateMode(true);
      executeIsolate();
    }
  };

  return (
    <div
      className={`absolute top-10 bottom-12 left-0 flex items-center transition-transform duration-300 ease-in-out z-50 pointer-events-none ${
        leftPanelOpen ? 'translate-x-2.5' : 'translate-x-[calc(-100%+1.25rem)]'
      }`}
    >
      <aside className='pointer-events-auto min-w-72 h-full flex flex-col bg-bim-bg-panel/90 backdrop-blur-md border-y border-l border-bim-border-main rounded-l-lg overflow-hidden shadow-2xl'>
        <div className='p-3 border-b border-bim-border-light flex items-center justify-between'>
          <h2 className='text-xs font-bold text-bim-text-main uppercase tracking-widest'>
            Model Browser
          </h2>
          <div className='flex gap-2'>
            <Search className='w-3.5 h-3.5 text-bim-text-muted/70 hover:text-bim-text-main cursor-pointer transition-colors' />
          </div>
        </div>

        <div className='flex-1 py-2 px-2'>
          {isTreeLoading ? (
            <div className='h-full z-10  flex flex-col items-center justify-center space-y-3'>
              <Loader2 className='w-8 h-8 text-bim-primary animate-spin' />
              <span className='text-[10px] font-bold text-bim-primary uppercase tracking-widest'>
                Building Tree...
              </span>
            </div>
          ) : (
            <Virtuoso
              style={{ height: '100%' }}
              data={flattenedNodes}
              itemContent={(_index, node) => (
                <TreeNode id={node.id} level={node.level} />
              )}
            />
          )}
        </div>

        <div className='p-3 flex flex-col gap-1.5 bg-bim-bg-main border-t border-bim-border-light '>
          <Button
            size='sm'
            onClick={handleToggleIsolate}
            disabled={isTreeLoading || (!isIsolateMode && !selectedNodeId)}
            className={`w-full border-1 text-[10px] font-bold uppercase tracking-wider h-8 transition-all ${
              isIsolateMode
                ? 'bg-bim-primary text-white border-bim-primary shadow-lg shadow-bim-primary/30 hover:bg-bim-primary/90'
                : 'border-bim-border-main text-bim-text-main'
            }`}
          >
            {isIsolateMode ? (
              <>
                <RotateCcw className='w-3 h-3' />
                Reset View
              </>
            ) : (
              <>
                <Layers2Icon className='w-3 h-3' />
                Isolate
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Tall Toggle Handle */}
      <button
        onClick={toggleLeftPanel}
        className='pointer-events-auto h-full w-6 flex items-center justify-center bg-bim-bg-item  border border-bim-border-main rounded-r-lg hover:bg-bim-bg-item-hover text-bim-text-main hover:text-bim-primary transition-all shadow-lg group cursor-pointer'
      >
        {leftPanelOpen ? (
          <ChevronLeft className='w-4 h-4 group-hover:scale-125 transition-transform' />
        ) : (
          <ChevronRight className='w-4 h-4 group-hover:scale-125 transition-transform' />
        )}
      </button>
    </div>
  );
};
