import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import TreeNode from './TreeNode';

export const LeftPanel = () => {
  const leftPanelOpen = useBIMStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useBIMStore((s) => s.toggleLeftPanel);
  const roots = useBIMStore((s) => s.spatialTreeRoots);
  const isTreeLoading = useBIMStore((s) => s.isTreeLoading);

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

        <div className='flex-1 overflow-y-auto py-2 px-4'>
          {isTreeLoading ? (
            <div className='h-full z-10  flex flex-col items-center justify-center space-y-3'>
              <Loader2 className='w-8 h-8 text-bim-primary animate-spin' />
              <span className='text-[10px] font-bold text-bim-primary uppercase tracking-widest'>
                Building Tree...
              </span>
            </div>
          ) : (
            <div className='space-y-1'>
              {roots.map((id) => (
                <TreeNode key={id} id={id} level={0} />
              ))}
            </div>
          )}
        </div>

        <div className='p-3 bg-bim-bg-main border-t border-bim-border-light flex gap-2'>
          <Button
            size='sm'
            disabled={isTreeLoading}
            className='flex-1 border-1 border-bim-border-main text-[10px] font-bold uppercase tracking-wider h-8'
          >
            Isolate
          </Button>
          <Button
            size='sm'
            disabled={isTreeLoading}
            className='flex-1 text-[10px] font-bold border-1 border-bim-border-main uppercase tracking-wider h-8'
          >
            Hide
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
