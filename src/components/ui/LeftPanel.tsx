import { Search, LayoutPanelLeft, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useBIMStore } from '../store/useBIMStore';

import TreeNode from './TreeNode';

export const LeftPanel: React.FC = () => {
  const leftPanelOpen = useBIMStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useBIMStore((s) => s.toggleLeftPanel);
  const roots = useBIMStore((s) => s.spatialTreeRoots);
  const isTreeLoading = useBIMStore((s) => s.isTreeLoading);

  if (!leftPanelOpen) {
    return (
      <div className='absolute left-4 top-20 pointer-events-auto'>
        <Button
          variant='secondary'
          size='icon'
          onClick={toggleLeftPanel}
          className='shadow-lg'
        >
          <LayoutPanelLeft className='w-5 h-5' />
        </Button>
      </div>
    );
  }

  return (
    <aside className='absolute left-4 top-20 bottom-12 min-w-72 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden pointer-events-auto shadow-2xl transition-all'>
      <div className='p-3 border-b border-slate-800 flex items-center justify-between'>
        <h2 className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
          Model Browser
        </h2>
        <div className='flex gap-2'>
          <Search className='w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer' />
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleLeftPanel}
            className='w-5 h-auto p-0 hover:bg-transparent'
          >
            <LayoutPanelLeft className='w-3.5 h-3.5' />
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto py-2 px-4'>
        {isTreeLoading ? (
          <div className='absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3'>
            <Loader2 className='w-8 h-8 text-blue-500 animate-spin' />
            <span className='text-[10px] font-bold text-blue-400 uppercase tracking-widest'>
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

      <div className='p-3 bg-slate-900 border-t border-slate-800 flex gap-2'>
        <Button
          variant='secondary'
          size='sm'
          className='flex-1 text-[10px] font-bold uppercase tracking-wider h-8'
        >
          Isolate
        </Button>
        <Button
          variant='secondary'
          size='sm'
          className='flex-1 text-[10px] font-bold uppercase tracking-wider h-8'
        >
          Hide
        </Button>
      </div>
    </aside>
  );
};
