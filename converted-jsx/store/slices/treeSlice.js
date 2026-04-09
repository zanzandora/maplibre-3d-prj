/*
  Cấu trúc dữ liệu của một Node trong cây không gian (Spatial Tree).
  Dữ liệu này được chuẩn hóa (normalized) để tối ưu việc tìm kiếm 
  và hiển thị cấp bậc (Storey -> Category -> Element).
*/

/*
  Quản lý cấu trúc cây phân cấp (Model Browser).
  Sử dụng Record<id, Node> để tối ưu hóa việc truy cập và cập nhật trạng thái
  đóng/mở (expanded) của các node mà không làm chậm việc render UI.
*/

export const createTreeSlice = (set) => ({
  spatialTreeById: {},
  spatialTreeRoots: [],
  totalElements: 0,
  expandedIds: new Set(),
  isTreeLoading: false,
  searchQuery: "",

  setSpatialTree: (nodes, roots) => {
    // Tính tổng cấu kiện để hiển thị tổng quan thông tin model.
    const total = Object.values(nodes).reduce((acc, node) => {
      if (node.isGroup && node.type === "CATEGORYGROUP" && node.count) {
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
