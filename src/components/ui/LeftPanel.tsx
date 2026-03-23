import {
  ChevronDown,
  ChevronRight,
  Search,
  LayoutPanelLeft,
} from 'lucide-react';
import { Button } from './Button';
import { useBIMStore } from '../store/useBIMStore';

export const LeftPanel: React.FC = () => {
  const leftPanelOpen = useBIMStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useBIMStore((s) => s.toggleLeftPanel);

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
    <aside className='absolute left-4 top-20 bottom-12 w-72 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden pointer-events-auto shadow-2xl transition-all'>
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

      <div className='flex-1 overflow-y-auto p-2'>
        <div className='space-y-1'>
          <TreeItem label='Floor 01 - Lobby' />
          <TreeItem label='Floor 02 - Office' expanded>
            <TreeItem label='Structural Columns' />
            <TreeItem label='Exterior Walls' expanded>
              <TreeItem label='CW-01 Glass Panel' />
              <TreeItem label='CW-02 Mullion System' selected />
            </TreeItem>
          </TreeItem>
          <TreeItem label='Floor 03 - Roof Terrace' />
        </div>
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

interface TreeItemProps {
  label: string;
  expanded?: boolean;
  selected?: boolean;
  children?: React.ReactNode;
}

const TreeItem: React.FC<TreeItemProps> = ({
  label,
  expanded,
  selected,
  children,
}) => {
  return (
    <div className='text-xs'>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer group transition-colors ${
          selected
            ? 'bg-blue-600/30 text-blue-100 border-l-2 border-blue-500'
            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        {children ? (
          expanded ? (
            <ChevronDown className='w-3 h-3 shrink-0' />
          ) : (
            <ChevronRight className='w-3 h-3 shrink-0' />
          )
        ) : (
          <div className='w-3' />
        )}
        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            selected ? 'bg-blue-500' : 'bg-slate-600 group-hover:bg-slate-400'
          }`}
        />
        <span className='truncate flex-1'>{label}</span>
      </div>
      {expanded && children && (
        <div className='ml-4 pl-1 border-l border-slate-800 mt-1'>
          {children}
        </div>
      )}
    </div>
  );
};
