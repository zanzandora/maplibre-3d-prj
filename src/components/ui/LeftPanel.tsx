import { useState, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  LayoutPanelLeft,
} from 'lucide-react';
import { Button } from './Button';
import { useBIMStore } from '../store/useBIMStore';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './Collapsible';

export const LeftPanel: React.FC = () => {
  const leftPanelOpen = useBIMStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useBIMStore((s) => s.toggleLeftPanel);
  const roots = useBIMStore((s) => s.spatialTreeRoots);

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
          {roots.map((id) => (
            <TreeNode key={id} id={id} level={0} />
          ))}
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

interface TreeNodeProps {
  id: string | number;
  level: number;
}

const TreeNode = memo(({ id, level }: TreeNodeProps) => {
  // Fine-grained subscription: only re-render if THIS node's data changes
  const node = useBIMStore((s) => s.spatialTreeById[id]);
  const isExpanded = useBIMStore((s) => s.expandedIds.has(id));
  const toggleNode = useBIMStore((s) => s.toggleNode);

  const [selected, setSelected] = useState(false);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={() => toggleNode(id)}>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer group transition-colors text-xs select-none ${
          selected
            ? 'bg-blue-600/30 text-blue-100 border-l-2 border-blue-500'
            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        style={{ marginLeft: level * 8 }}
        onClick={(e) => {
          e.stopPropagation();

          // Nếu là thư mục Group -> Chỉ Toggle đóng/mở
          if (node.isGroup) {
            toggleNode(id);
          }
          // Nếu là cấu kiện thật -> Select trên màn hình 3D
          else {
            setSelected(!selected);
          }
        }}
      >
        <CollapsibleTrigger
          onClick={(e) => {
            if (!hasChildren) {
              e.preventDefault();
            }
            e.stopPropagation();
          }}
        >
          <div className='w-4 h-4 flex items-center justify-center hover:bg-slate-700 rounded'>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className='w-3 h-3 shrink-0' />
              ) : (
                <ChevronRight className='w-3 h-3 shrink-0' />
              )
            ) : (
              <div className='w-3' />
            )}
          </div>
        </CollapsibleTrigger>
        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            selected ? 'bg-blue-500' : 'bg-slate-600 group-hover:bg-slate-400'
          }`}
        />
        <span className='truncate flex-1'>
          {node.label}{' '}
          {node.isGroup && (
            <span className='text-slate-500'>({node.count})</span>
          )}
        </span>
        {/* <span className='text-[10px] opacity-30 group-hover:opacity-60 transition-opacity ml-1 uppercase'>
          {node.type.replace('IFC', '')}
        </span> */}
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className='mt-1 space-y-1'>
            {node.children.map((childId) => (
              <TreeNode key={childId} id={childId} level={level + 1} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
});

TreeNode.displayName = 'TreeNode';
