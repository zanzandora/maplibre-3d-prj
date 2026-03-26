/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';

export interface ISelectedElement {
  [key: string]: any;
  psets: Record<string, Record<string, any>>;
  _localId?: number;
}

export interface ISpatialNode {
  id: string | number;
  label: string;
  type: string;
  children: (string | number)[];
  parentId: string | number | null;
  isGroup?: boolean;
  count?: number;
}

interface BIMState {
  isBIMVisible: boolean;
  activeTool:
    | 'select'
    | 'clip'
    | 'measure'
    | 'orbit'
    | 'isolate'
    | 'hide'
    | null;
  activeSubTools: Record<string, string>;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  // Selection
  selectedElement: ISelectedElement | null;
  selectedNodeId: string | number | null;
  isHighlighting: boolean;

  // Normalized Spatial Tree
  spatialTreeById: Record<string | number, ISpatialNode>;
  spatialTreeRoots: (string | number)[];
  totalElements: number;
  expandedIds: Set<string | number>;
  isTreeLoading: boolean; // Added for Tree Generation loading

  // UI Actions
  setBIMVisible: (visible: boolean) => void;
  setActiveTool: (tool: BIMState['activeTool']) => void;
  setActiveSubTool: (toolId: string, subToolId: string) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // Select Element Actions
  setSelectedElement: (element: ISelectedElement | null) => void;
  setSelectedNodeId: (id: string | number | null) => void;
  setIsHighlighting: (loading: boolean) => void;

  // Tree Actions
  setSpatialTree: (
    nodes: Record<string | number, ISpatialNode>,
    roots: (string | number)[]
  ) => void;
  toggleNode: (id: string | number) => void;
  setIsTreeLoading: (loading: boolean) => void; // Added action
}

export const useBIMStore = create<BIMState>((set) => ({
  isBIMVisible: false,
  activeTool: 'select',
  activeSubTools: {
    measure: 'length',
  },
  leftPanelOpen: true,
  rightPanelOpen: true,
  selectedElement: null,
  selectedNodeId: null,
  isHighlighting: false,

  spatialTreeById: {},
  spatialTreeRoots: [],
  totalElements: 0,
  expandedIds: new Set(),
  isTreeLoading: false,

  setBIMVisible: (visible) => set({ isBIMVisible: visible }),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveSubTool: (toolId, subToolId) =>
    set((state) => ({
      activeSubTools: {
        ...state.activeSubTools,
        [toolId]: subToolId,
      },
    })),

  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setIsHighlighting: (loading) => set({ isHighlighting: loading }),

  setSpatialTree: (nodes, roots) => {
    const total = Object.values(nodes).reduce((acc, node) => {
      if (node.isGroup && node.type === 'CategoryGroup' && node.count) {
        return acc + node.count;
      }
      return acc;
    }, 0);

    set({
      spatialTreeById: nodes,
      spatialTreeRoots: roots,
      totalElements: total,
    });
  },
  toggleNode: (id) =>
    set((state) => {
      const nextExpanded = new Set(state.expandedIds);
      if (nextExpanded.has(id)) {
        nextExpanded.delete(id);
      } else {
        nextExpanded.add(id);
      }
      return { expandedIds: nextExpanded };
    }),
  setIsTreeLoading: (loading) => set({ isTreeLoading: loading }),
}));
