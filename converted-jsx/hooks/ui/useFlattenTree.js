import { useMemo } from "react";

export const useFlattenTree = (
  roots,
  nodesById,
  expandedIds,
  searchQuery = "",
) => {
  return useMemo(() => {
    const flattened = [];
    const query = searchQuery.trim().toLowerCase();

    /*
      Trong chế độ tìm kiếm, chúng ta cần xác định các node nào sẽ được hiển thị.
      Một node hiển thị nếu:
      1. Bản thân nó khớp với từ khóa tìm kiếm.
      2. Nó là tổ tiên (ancestor) của một node khớp với từ khóa.
    */
    const visibleIdsInSearch = new Set();

    if (query) {
      Object.values(nodesById).forEach((node) => {
        if (node.label.toLowerCase().includes(query)) {
          // Thêm node khớp và tất cả tổ tiên của nó vào tập hợp hiển thị
          let current = node;
          while (current && !visibleIdsInSearch.has(current.id)) {
            visibleIdsInSearch.add(current.id);
            current = current.parentId
              ? nodesById[current.parentId]
              : undefined;
          }
        }
      });
    }

    const flatten = (id, level) => {
      const node = nodesById[id];
      if (!node) return;

      if (query && !visibleIdsInSearch.has(id)) return;

      flattened.push({ id, level });

      /*
        Điều kiện để duyệt tiếp các node con:
        - Ở chế độ thường: Node cha phải nằm trong danh sách expandedIds.
        - Ở chế độ tìm kiếm: Node cha phải nằm trong danh sách visibleIdsInSearch.
      */
      const shouldExpand = query
        ? visibleIdsInSearch.has(id)
        : expandedIds.has(id);

      if (shouldExpand && node.children) {
        node.children.forEach((childId) => flatten(childId, level + 1));
      }
    };

    roots.forEach((rootId) => flatten(rootId, 0));
    return flattened;
  }, [roots, nodesById, expandedIds, searchQuery]);
};
