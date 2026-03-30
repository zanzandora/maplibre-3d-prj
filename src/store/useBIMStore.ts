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

// Xuất các Types để các component có thể sử dụng (e.g. trong Tree hoặc Property Panel)
export type { ISelectedElement } from './slices/selectionSlice';
export type { ISpatialNode } from './slices/treeSlice';

/*
  BIMState là sự hợp nhất của tất cả các Slice.
  Pattern này giúp quản lý một State lớn và phức tạp mà không làm 
  file store trở nên quá cồng kềnh.
*/
export type BIMState = UISlice &
  SelectionSlice &
  TreeSlice &
  MeasureSlice &
  VisibilitySlice;

export const useBIMStore = create<BIMState>((...a) => ({
  ...createUISlice(...a),
  ...createSelectionSlice(...a),
  ...createTreeSlice(...a),
  ...createMeasureSlice(...a),
  ...createVisibilitySlice(...a),
}));
