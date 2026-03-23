/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';

export interface SelectedElement {
  [key: string]: any;
  psets: Record<string, Record<string, any>>;
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
  selectedElement: SelectedElement | null;

  // Actions
  setBIMVisible: (visible: boolean) => void;
  setActiveTool: (tool: BIMState['activeTool']) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setSelectedElement: (element: SelectedElement | null) => void;
}

export const useBIMStore = create<BIMState>((set) => ({
  isBIMVisible: false,
  activeTool: 'select',
  leftPanelOpen: true,
  rightPanelOpen: true,
  selectedElement: null,

  setBIMVisible: (visible) => set({ isBIMVisible: visible }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setSelectedElement: (element) => set({ selectedElement: element }),
}));
