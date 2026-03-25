/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';

export interface ISelectedElement {
  [key: string]: any;
  psets: Record<string, Record<string, any>>;
}

export interface ISpatialNode {
  id: string | number;
  label: string;
  type: string;
  children: number[]; // Store child IDs for normalized traversal
  parentId: number | null;
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
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  // Select Element
  selectedElement: ISelectedElement | null;
  isHighlighting: boolean;

  // Normalized Spatial Tree
  spatialTreeById: Record<string | number, ISpatialNode>;
  spatialTreeRoots: string[] | number[];
  expandedIds: Set<string | number>;

  // UI Actions
  setBIMVisible: (visible: boolean) => void;
  setActiveTool: (tool: BIMState['activeTool']) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // Select Element Actions
  setSelectedElement: (element: ISelectedElement | null) => void;
  setIsHighlighting: (loading: boolean) => void;

  // Tree Actions
  setSpatialTree: (
    nodes: Record<number, ISpatialNode>,
    roots: string[] | number[]
  ) => void;
  toggleNode: (id: string | number) => void;
}

export const useBIMStore = create<BIMState>((set) => ({
  isBIMVisible: false,
  activeTool: 'select',
  leftPanelOpen: true,
  rightPanelOpen: true,
  selectedElement: null,
  isHighlighting: false,

  spatialTreeById: {},
  spatialTreeRoots: [],
  expandedIds: new Set(),

  setBIMVisible: (visible) => set({ isBIMVisible: visible }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setIsHighlighting: (loading) => set({ isHighlighting: loading }),

  setSpatialTree: (nodes, roots) =>
    set({ spatialTreeById: nodes, spatialTreeRoots: roots }),
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
}));
