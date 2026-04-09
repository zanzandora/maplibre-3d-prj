/**
 * Truy xuất đệ quy tất cả các ID phần tử thực tế (Leaf Elements) từ một node trong cây không gian.
 * Hàm này giúp xác định tập hợp các LocalId cần tác động khi chọn một Tầng hoặc một Nhóm cấu kiện.
 *
 * @param nodeId - ID của node bắt đầu (Storey, Group hoặc Element).
 * @param spatialTreeById - Bản đồ dữ liệu cây không gian từ Store.
 * @returns Mảng các ID phần tử (số nguyên).
 */
export const getAllElementIds = (nodeId, spatialTreeById) => {
  const targetNode = spatialTreeById[nodeId];
  if (!targetNode) return [];

  // note: Nếu node không có con, nó được coi là node lá (phần tử thực tế).
  if (!targetNode.children || targetNode.children.length === 0) {
    return typeof nodeId === "number" ? [nodeId] : [];
  }

  const ids = [];
  for (const childId of targetNode.children) {
    // Đệ quy để lấy ID từ các cấp thấp hơn
    ids.push(...getAllElementIds(childId, spatialTreeById));
  }
  return ids;
};
