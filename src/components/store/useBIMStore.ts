import { create } from 'zustand';

interface BIMState {
  isBIMVisible: boolean;
  activeTool: 'select' | 'clip' | 'measure' | 'orbit' | 'isolate' | 'hide' | null;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  selectedElement: {
    id: string;
    name: string;
    category: string;
    geometry: {
      length: string;
      width: string;
      height: string;
      volume: string;
    };
    attributes: {
      material: string;
      phasing: string;
      fireRating: string;
      uValue: string;
    };
    lifecycle: {
      status: string;
      costEst: string;
    };
  } | null;
  
  // Actions
  setBIMVisible: (visible: boolean) => void;
  setActiveTool: (tool: BIMState['activeTool']) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setSelectedElement: (element: BIMState['selectedElement']) => void;
}

export const useBIMStore = create<BIMState>((set) => ({
  isBIMVisible: false,
  activeTool: 'select',
  leftPanelOpen: true,
  rightPanelOpen: true,
  selectedElement: {
    id: '4829-AF-0012',
    name: 'CW-02 Mullion System',
    category: 'Exterior Walls',
    geometry: {
      length: '4,200.00 mm',
      width: '150.00 mm',
      height: '3,500.00 mm',
      volume: '2.205 m³',
    },
    attributes: {
      material: 'Aluminum 6061-T6',
      phasing: 'NEW CONSTRUCTION',
      fireRating: '60 min',
      uValue: '1.4 W/m²K',
    },
    lifecycle: {
      status: 'Awaiting Install',
      costEst: '$1,240.00',
    },
  },

  setBIMVisible: (visible) => set({ isBIMVisible: visible }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setSelectedElement: (element) => set({ selectedElement: element }),
}));
