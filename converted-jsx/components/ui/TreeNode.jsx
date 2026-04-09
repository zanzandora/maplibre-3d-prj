import { memo } from "react";
import { useBIMStore } from "../../store/useBIMStore";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useBIMContext } from "../../context/bim/BIMContext";
import { Highlighter } from "@thatopen/components-front";
import * as OBC from "@thatopen/components";
import { getAllElementIds } from "../../utils";

const TreeNode = memo(({ id, level }) => {
  const node = useBIMStore((s) => s.spatialTreeById[id]);
  const isExpanded = useBIMStore((s) => s.expandedIds.has(id));
  const toggleNode = useBIMStore((s) => s.toggleNode);

  // Global single selection state
  const isSelected = useBIMStore((s) => s.selectedNodeId === id);
  const setSelectedNodeId = useBIMStore((s) => s.setSelectedNodeId);
  const setSelectedElement = useBIMStore((s) => s.setSelectedElement);
  const spatialTreeById = useBIMStore((s) => s.spatialTreeById);

  // Visibility state
  const isHidden = useBIMStore((s) => s.hiddenIds.has(id));
  const toggleVisibility = useBIMStore((s) => s.toggleVisibility);

  const { components, fragments } = useBIMContext();

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  const handleSelect = async (e) => {
    e.stopPropagation();

    if (!components || !fragments) return;
    const highlighter = components.get(Highlighter);
    const modelId = fragments.list.keys().next().value;
    if (!modelId) return;

    // Toggle logic: if already selected, clear selection
    if (isSelected) {
      setSelectedNodeId(null);
      setSelectedElement(null);
      highlighter.clear("select");
      return;
    }

    // 1. Get all constituent elements to highlight
    const elementsToHighlight = getAllElementIds(id, spatialTreeById);

    // 2. Perform 3D highlight (highlightByID for 'select' tag replaces previous selection)
    if (elementsToHighlight.length > 0) {
      highlighter.highlightByID("select", {
        [modelId]: new Set(elementsToHighlight),
      });
    }

    // 3. Update UI state
    setSelectedNodeId(id);

    if (
      node.isGroup ||
      node.type === "IFCBUILDINGSTOREY" ||
      node.type === "CATEGORYGROUP"
    ) {
      setSelectedElement(null);
    }
  };

  const handleToggleVisibility = (e) => {
    e.stopPropagation();
    if (!components || !fragments) return;

    const hider = components.get(OBC.Hider);
    const modelId = fragments.list.keys().next().value;
    if (!modelId) return;

    const elementIds = getAllElementIds(id, spatialTreeById);
    if (elementIds.length === 0) return;

    const fragmentMap = { [modelId]: new Set(elementIds) };

    // If it was hidden, show it; if it was visible, hide it.
    const newVisibleState = isHidden;
    hider.set(newVisibleState, fragmentMap);
    toggleVisibility(id);
  };

  const handleToggleNode = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      toggleNode(id);
    }
  };

  return (
    <div
      className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer group transition-colors text-xs select-none ${
        isSelected
          ? "bg-bim-primary/15 text-bim-text-main border-l-2 border-bim-primary"
          : "hover:bg-bim-bg-item-hover text-bim-text-muted hover:text-bim-text-main"
      }`}
      style={{ marginLeft: level * 8 }}
    >
      <div
        onClick={handleToggleNode}
        className="w-4 h-4 flex items-center justify-center hover:bg-bim-bg-item-hover rounded cursor-pointer"
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 shrink-0" />
          )
        ) : (
          <div className="w-3" />
        )}
      </div>

      {/* Visibility Icon */}
      <button
        onClick={handleToggleVisibility}
        className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
          isHidden
            ? "text-bim-text-muted/40"
            : "text-bim-primary hover:text-bim-primary/80"
        }`}
      >
        {isHidden ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>

      <span className="flex-1 truncate ml-1" onClick={handleSelect}>
        {node.label}{" "}
        {node.isGroup && (
          <span className="text-bim-text-muted/80">({node.count})</span>
        )}
      </span>
    </div>
  );
});

TreeNode.displayName = "TreeNode";

export default TreeNode;
