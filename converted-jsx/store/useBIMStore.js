import { create } from "zustand";
import { createUISlice } from "./slices/uiSlice";
import { createSelectionSlice } from "./slices/selectionSlice";
import { createTreeSlice } from "./slices/treeSlice";
import { createMeasureSlice } from "./slices/measureSlice";
import { createVisibilitySlice } from "./slices/visibilitySlice";
import { createProjectSlice } from "./slices/projectSlice";

// Xuất các Types để các component có thể sử dụng (e.g. trong Tree hoặc Property Panel)

/*
  BIMState là sự hợp nhất của tất cả các Slice.
  Pattern này giúp quản lý một State lớn và phức tạp mà không làm 
  file store trở nên quá cồng kềnh.
*/

export const useBIMStore = create((...a) => ({
  ...createUISlice(...a),
  ...createSelectionSlice(...a),
  ...createTreeSlice(...a),
  ...createMeasureSlice(...a),
  ...createVisibilitySlice(...a),
  ...createProjectSlice(...a),

  /*
    Hàm Reset State được sử dụng khi người dùng chuyển đổi Dự án (Project).
    Đảm bảo xóa sạch các trạng thái cũ như Selection, Tree, Visibility và các Đo lường.
  */
  resetBIMState: () => {
    const [set] = a;
    set({
      selectedElement: null,
      selectedNodeId: null,
      isHighlighting: false,
      spatialTreeById: {},
      spatialTreeRoots: [],
      totalElements: 0,
      expandedIds: new Set(),
      hiddenIds: new Set(),
      // Không reset projects list và currentProjectId để giữ trạng thái chuyển đổi
    });
  },
}));
