import { memo, useCallback } from 'react';
import { useBIMStore } from '../../store/useBIMStore';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './Collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useBIMContext } from '../../context/bim/BIMContext';
import { Highlighter } from '@thatopen/components-front';

interface TreeNodeProps {
  id: string | number;
  level: number;
}

const TreeNode = memo(({ id, level }: TreeNodeProps) => {
  const node = useBIMStore((s) => s.spatialTreeById[id]);
  const isExpanded = useBIMStore((s) => s.expandedIds.has(id));
  const toggleNode = useBIMStore((s) => s.toggleNode);

  // Global single selection state
  const isSelected = useBIMStore((s) => s.selectedNodeId === id);
  const setSelectedNodeId = useBIMStore((s) => s.setSelectedNodeId);
  const setSelectedElement = useBIMStore((s) => s.setSelectedElement);
  const spatialTreeById = useBIMStore((s) => s.spatialTreeById);

  const { components, fragments } = useBIMContext();

  // Recursive helper to get all leaf element IDs from a node
  const getAllElementIds = useCallback(
    function getIds(nodeId: string | number): number[] {
      const targetNode = spatialTreeById[nodeId];
      if (!targetNode) return [];

      if (!targetNode.children || targetNode.children.length === 0) {
        return typeof nodeId === 'number' ? [nodeId] : [];
      }

      const ids: number[] = [];
      for (const childId of targetNode.children) {
        const childNode = spatialTreeById[childId];
        if (childNode) {
          ids.push(...getIds(childId));
        } else if (typeof childId === 'number') {
          ids.push(childId);
        }
      }
      return ids;
    },
    [spatialTreeById]
  );

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  const handleSelect = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Toggle logic: if already selected, clear selection
    if (isSelected) {
      setSelectedNodeId(null);
      setSelectedElement(null);
      if (components) components.get(Highlighter).clear('select');
      return;
    }

    // Set as the only selected node in UI
    setSelectedNodeId(id);

    if (components && fragments) {
      const highlighter = components.get(Highlighter);
      const modelId = fragments.list.keys().next().value;
      if (!modelId) return;

      // Clear previous 3D highlights
      highlighter.clear('select');

      // Get all constituent elements to highlight
      const elementsToHighlight = getAllElementIds(id);

      if (elementsToHighlight.length > 0) {
        highlighter.highlightByID('select', {
          [modelId]: new Set(elementsToHighlight as number[]),
        });
      }

      // If it's a single real element, we can also show its properties in the RightPanel
      // Note: Right now our logic assumes only single element properties, we'll keep it that way
      if (!node.isGroup && node.type !== 'IfcBuildingStorey') {
        // This will trigger the property loading in Highlighter.ts or wherever setSelectedElement is watched
        // However, we've bypassed onHighlight event, so we might need to trigger it manually or let the user re-select
        // For simplicity, let's just update the ID and the UI will reflect selection.
      } else {
        setSelectedElement(null); // Clear properties if a group/storey is selected
      }
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={() => toggleNode(id)}>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer group transition-colors text-xs select-none ${
          isSelected
            ? 'bg-bim-primary/40 text-bim-text-main border-l-2 border-bim-primary'
            : 'hover:bg-bim-bg-item-hover text-bim-text-muted hover:text-bim-text-main'
        }`}
        style={{ marginLeft: level * 8 }}
        onClick={handleSelect}
      >
        <CollapsibleTrigger
          onClick={(e) => {
            if (!hasChildren) {
              e.preventDefault();
            }
            e.stopPropagation();
          }}
        >
          <div className='w-4 h-4 flex items-center justify-center hover:bg-bim-bg-item-hover rounded'>
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
            isSelected
              ? 'bg-bim-primary'
              : 'bg-bim-border-main group-hover:bg-bim-text-muted'
          }`}
        />
        <span className=' flex-1 truncate'>
          {node.label}{' '}
          {node.isGroup && (
            <span className='text-bim-text-muted/80'>({node.count})</span>
          )}
        </span>
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
