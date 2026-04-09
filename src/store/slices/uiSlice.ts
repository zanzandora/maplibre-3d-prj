import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

/*
  Quản lý trạng thái giao diện người dùng (Panels, Toolbar).
  Kiểm soát việc ẩn hiện của các panel biên và lựa chọn công cụ active.
*/
export interface UISlice {
  isBIMVisible: boolean;
  isIsolateMode: boolean; // Trạng thái đang trong chế độ cô lập (Hide all except selection)
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
  setBIMVisible: (visible: boolean) => void;
  setIsIsolateMode: (active: boolean) => void;
  setActiveTool: (tool: UISlice['activeTool']) => void;
  setActiveSubTool: (toolId: string, subToolId: string) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const createUISlice: StateCreator<BIMState, [], [], UISlice> = (
  set
) => ({
  isBIMVisible: false,
  isIsolateMode: false,
  activeTool: 'select',
  activeSubTools: {
    measure: 'length',
  },
  leftPanelOpen: true,
  rightPanelOpen: true,

  setBIMVisible: (visible) => set({ isBIMVisible: visible }),
  setIsIsolateMode: (active) => set({ isIsolateMode: active }),
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
});
