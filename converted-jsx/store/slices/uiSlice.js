/*
  Quản lý trạng thái giao diện người dùng (Panels, Toolbar).
  Kiểm soát việc ẩn hiện của các panel biên và lựa chọn công cụ active.
*/

export const createUISlice = (set) => ({
  isBIMVisible: false,
  isIsolateMode: false,
  activeTool: "select",
  activeSubTools: {
    measure: "length",
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
