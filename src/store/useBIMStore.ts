import { create } from 'zustand';
import { createUISlice, type UISlice } from './slices/uiSlice';
import {
  createSelectionSlice,
  type SelectionSlice,
} from './slices/selectionSlice';
import { createTreeSlice, type TreeSlice } from './slices/treeSlice';
import { createMeasureSlice, type MeasureSlice } from './slices/measureSlice';
import {
  createVisibilitySlice,
  type VisibilitySlice,
} from './slices/visibilitySlice';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';

// Xuất các Types để các component có thể sử dụng (e.g. trong Tree hoặc Property Panel)
export type { ISelectedElement } from './slices/selectionSlice';
export type { ISpatialNode } from './slices/treeSlice';
export type { Project } from './slices/projectSlice';

/*
  BIMState là sự hợp nhất của tất cả các Slice.
  Pattern này giúp quản lý một State lớn và phức tạp mà không làm 
  file store trở nên quá cồng kềnh.
*/
export type BIMState = UISlice &
  SelectionSlice &
  TreeSlice &
  MeasureSlice &
  VisibilitySlice &
  ProjectSlice & {
    resetBIMState: () => void;
  };

export const useBIMStore = create<BIMState>((...a) => ({
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
