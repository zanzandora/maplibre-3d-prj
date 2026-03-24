import { useState } from 'react';
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

interface ModelNode {
  id: number;
  label: string;
  type: string;
  expressIDs: number[];
  children?: ModelNode[];
}

const mock: ModelNode[] = [
  {
    id: 100,
    label: 'TẦNG 1',
    type: 'IFCBUILDINGSTOREY',
    expressIDs: [101, 102, 103, 104, 105],
    children: [
      {
        id: 200,
        label: 'Cấu kiện tường (IFCWALL)',
        type: 'CATEGORY',
        expressIDs: [101, 102],
        children: [
          {
            id: 101,
            label: 'Wall-Standard-01',
            type: 'ELEMENT',
            expressIDs: [101],
          },
          {
            id: 102,
            label: 'Wall-Standard-02',
            type: 'ELEMENT',
            expressIDs: [102],
            children: [
              {
                id: 101,
                label: 'Wall-Standard-01',
                type: 'ELEMENT',
                expressIDs: [101],
              },
              {
                id: 103,
                label: 'Wall-Standard-03',
                type: 'ELEMENT',
                expressIDs: [102],
                children: [
                  {
                    id: 101,
                    label: 'Wall-Standard-01',
                    type: 'ELEMENT',
                    expressIDs: [101],
                  },
                  {
                    id: 104,
                    label: 'Wall-Standard-02',
                    type: 'ELEMENT',
                    expressIDs: [102],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 201,
        label: 'Cửa đi (IFCDOOR)',
        type: 'CATEGORY',
        expressIDs: [103],
        children: [
          {
            id: 103,
            label: 'Door-Single-600x2100',
            type: 'ELEMENT',
            expressIDs: [103],
          },
        ],
      },
    ],
  },
  {
    id: 300,
    label: 'TẦNG 2',
    type: 'IFCBUILDINGSTOREY',
    expressIDs: [301, 302],
    children: [
      {
        id: 301,
        label: 'Sàn bê tông (IFCSLAB)',
        type: 'ELEMENT',
        expressIDs: [301],
      },
      {
        id: 302,
        label: 'Dầm thép (IFCBEAM)',
        type: 'ELEMENT',
        expressIDs: [302],
      },
    ],
  },
  {
    id: 400,
    label: 'TẦNG TUM',
    type: 'IFCBUILDINGSTOREY',
    expressIDs: [401],
    children: [],
  },
];

export const LeftPanel: React.FC = () => {
  const leftPanelOpen = useBIMStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useBIMStore((s) => s.toggleLeftPanel);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const toggleNode = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const selectNode = (id: number) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const renderTree = (nodes: ModelNode[]) => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        label={node.label}
        expanded={expandedIds.has(node.id)}
        selected={selectedId === node.id}
        onToggle={() => toggleNode(node.id)}
        onSelect={() => selectNode(node.id)}
        hasChildren={node.children && node.children.length > 0}
      >
        {node.children && node.children.length > 0 && renderTree(node.children)}
      </TreeItem>
    ));
  };

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
        <div className='space-y-1'>{renderTree(mock)}</div>
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
  onToggle: () => void;
  onSelect: () => void;
  hasChildren?: boolean;
  children?: React.ReactNode;
}

const TreeItem: React.FC<TreeItemProps> = ({
  label,
  expanded,
  selected,
  onToggle,
  onSelect,
  hasChildren,
  children,
}) => {
  return (
    <Collapsible
      open={expanded}
      onOpenChange={onToggle}
      className='text-xs select-none'
    >
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer group transition-colors ${
          selected
            ? 'bg-blue-600/30 text-blue-100 border-l-2 border-blue-500'
            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
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
              expanded ? (
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
        <span className='truncate flex-1'>{label}</span>
      </div>
      <CollapsibleContent>
        {children && (
          <div className='ml-3 pl-2 border-l border-slate-800/50 mt-1 space-y-1'>
            {children}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
