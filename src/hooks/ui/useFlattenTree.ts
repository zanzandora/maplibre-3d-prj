import { useMemo } from 'react';
import type { ISpatialNode } from '../../store/slices/treeSlice';

export interface FlattenedNode {
  id: string | number;
  level: number;
}

export const useFlattenTree = (
  roots: (string | number)[],
  nodesById: Record<string | number, ISpatialNode>,
  expandedIds: Set<string | number>
) => {
  return useMemo(() => {
    const flattened: FlattenedNode[] = [];

    const flatten = (id: string | number, level: number) => {
      const node = nodesById[id];
      if (!node) return;

      flattened.push({ id, level });

      // Chỉ thêm con vào danh sách phẳng nếu node cha đang được mở
      if (expandedIds.has(id) && node.children) {
        node.children.forEach((childId) => flatten(childId, level + 1));
      }
    };

    roots.forEach((rootId) => flatten(rootId, 0));
    return flattened;
  }, [roots, nodesById, expandedIds]);
};
