import { memo, useState } from 'react';
import { useBIMStore } from '../store/useBIMStore';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './Collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
        <span className=' flex-1'>
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

export default TreeNode;
