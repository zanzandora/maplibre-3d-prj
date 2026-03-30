/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

/*
  Dữ liệu chi tiết của một phần tử BIM được chọn.
  Lưu trữ cả psets (Property Sets) để hiển thị trên bảng thuộc tính.
*/
export interface ISelectedElement {
  [key: string]: any;
  psets: Record<string, Record<string, any>>;
  _localId?: number;
}

/*
  Quản lý trạng thái lựa chọn (Selection) trong cả môi trường 3D và Tree.
  Giữ sự đồng bộ giữa đối tượng đang được Highlight và dữ liệu hiển thị.
*/
export interface SelectionSlice {
  selectedElement: ISelectedElement | null;
  selectedNodeId: string | number | null;
  isHighlighting: boolean;
  setSelectedElement: (element: ISelectedElement | null) => void;
  setSelectedNodeId: (id: string | number | null) => void;
  setIsHighlighting: (loading: boolean) => void;
}

export const createSelectionSlice: StateCreator<
  BIMState,
  [],
  [],
  SelectionSlice
> = (set) => ({
  selectedElement: null,
  selectedNodeId: null,
  isHighlighting: false,

  setSelectedElement: (element) => set({ selectedElement: element }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setIsHighlighting: (loading) => set({ isHighlighting: loading }),
});
