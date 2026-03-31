import type { StateCreator } from 'zustand';
import type { BIMState } from '../useBIMStore';

/*
  Cấu trúc dữ liệu của một Node trong cây không gian (Spatial Tree).
  Dữ liệu này được chuẩn hóa (normalized) để tối ưu việc tìm kiếm 
  và hiển thị cấp bậc (Storey -> Category -> Element).
*/
export interface ISpatialNode {
  id: string | number;
  label: string;
  type: string;
  children: (string | number)[];
  parentId: string | number | null;
  isGroup?: boolean;
  count?: number;
}

/*
  Quản lý cấu trúc cây phân cấp (Model Browser).
  Sử dụng Record<id, Node> để tối ưu hóa việc truy cập và cập nhật trạng thái
  đóng/mở (expanded) của các node mà không làm chậm việc render UI.
*/
export interface TreeSlice {
  spatialTreeById: Record<string | number, ISpatialNode>;
  spatialTreeRoots: (string | number)[];
  totalElements: number;
  expandedIds: Set<string | number>;
  isTreeLoading: boolean;
  searchQuery: string;
  setSpatialTree: (
    nodes: Record<string | number, ISpatialNode>,
    roots: (string | number)[]
  ) => void;
  toggleNode: (id: string | number) => void;
  setIsTreeLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const createTreeSlice: StateCreator<BIMState, [], [], TreeSlice> = (
  set
) => ({
  spatialTreeById: {},
  spatialTreeRoots: [],
  totalElements: 0,
  expandedIds: new Set(),
  isTreeLoading: false,
  searchQuery: '',

  setSpatialTree: (nodes, roots) => {
    // Tính tổng cấu kiện để hiển thị tổng quan thông tin model.
    const total = Object.values(nodes).reduce((acc, node) => {
      if (node.isGroup && node.type === 'CATEGORYGROUP' && node.count) {
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

  setSearchQuery: (query) => set({ searchQuery: query }),
});
