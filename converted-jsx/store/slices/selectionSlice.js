/* eslint-disable @typescript-eslint/no-explicit-any */

/*
  Dữ liệu chi tiết của một phần tử BIM được chọn.
  Lưu trữ cả psets (Property Sets) để hiển thị trên bảng thuộc tính.
*/

/*
  Quản lý trạng thái lựa chọn (Selection) trong cả môi trường 3D và Tree.
  Giữ sự đồng bộ giữa đối tượng đang được Highlight và dữ liệu hiển thị.
*/

export const createSelectionSlice = (set, get) => ({
  selectedElement: null,
  selectedNodeId: null,
  isHighlighting: false,

  setSelectedElement: (element) => set({ selectedElement: element }),

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });

    // Tự động mở rộng các node cha nếu có ID được chọn
    if (id !== null) {
      const state = get();
      const treeMap = state.spatialTreeById;
      const nextExpanded = new Set(state.expandedIds);

      let currentNode = treeMap[id];
      while (currentNode && currentNode.parentId !== null) {
        nextExpanded.add(currentNode.parentId);
        currentNode = treeMap[currentNode.parentId];
      }

      set({ expandedIds: nextExpanded });
    }
  },

  setIsHighlighting: (loading) => set({ isHighlighting: loading }),
});
