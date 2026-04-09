/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Chuyển đổi cấu trúc dữ liệu từ FragmentsModel thành cây không gian chuẩn hóa (Normalized Tree).
 * Cấu trúc đầu ra được tối ưu cho việc render UI phân cấp: Storey > Category Group > Element.
 * Sử dụng mô hình lưu trữ dạng phẳng (Map) để tối ưu hiệu suất truy xuất và quản lý state.
 *
 * @param model - Mô hình Fragments từ That Open Engine.
 * @returns Object chứa 'nodes' (Map các node) và 'roots' (Danh sách ID gốc).
 */
export const generateSpatialTree = async (model) => {
  try {
    console.time("⏱️ Tree Generation Time");

    await model.getSpatialStructure();

    // note: Loại bỏ các cấu kiện không có hình học (vô hình) như IfcSpace để tránh làm nhiễu cây thư mục UI.
    const geometryItems = await model.getItemsWithGeometry();
    const validIds = new Set();

    const localIds = await Promise.all(
      geometryItems.map((item) => item?.getLocalId()),
    );
    for (const id of localIds) {
      if (id !== undefined && id !== null) validIds.add(id);
    }

    // note: Tìm tất cả các Tầng (Storeys) trong dự án
    const categoryIds = await model.getItemsOfCategories([/IFCBUILDINGSTOREY/]);
    const storeyIds = categoryIds.IFCBUILDINGSTOREY || [];

    const treeMap = {};
    const rootIds = [];

    const storeysData = await model.getItemsData(storeyIds, {
      attributesDefault: false,
      attributes: ["Name"],
    });

    // note: Duyệt qua từng Tầng để bóc tách thông tin
    for (let sIndex = 0; sIndex < storeyIds.length; sIndex++) {
      const storeyId = storeyIds[sIndex];
      const storeyIdStr = storeyId.toString();
      const storeyName = storeysData[sIndex]?.Name?.value || `Tầng ${storeyId}`;

      const childrenIds = await model.getItemsChildren([storeyId]);

      const validChildrenIds = (childrenIds || []).filter((id) =>
        validIds.has(id),
      );
      if (validChildrenIds.length === 0) continue;

      rootIds.push(storeyIdStr);

      const childrenData = await model.getItemsData(validChildrenIds, {
        attributesDefault: false,
        attributes: ["Name"],
      });

      const typeGroups = {};

      for (let i = 0; i < validChildrenIds.length; i++) {
        const childId = validChildrenIds[i];
        const data = childrenData[i];

        if (!data) continue;

        const rawCategory = data._category?.value || "UNKNOWN_CATEGORY";
        const displayCategory = rawCategory.replace("IFC", "");

        if (!typeGroups[displayCategory]) typeGroups[displayCategory] = [];
        typeGroups[displayCategory].push(childId);

        treeMap[childId] = {
          id: childId,
          label: data.Name?.value || `Element ${childId}`,
          type: displayCategory,
          children: [],
          parentId: `GROUP_${storeyIdStr}_${displayCategory}`,
        };
      }

      const storeyChildren = [];

      for (const [categoryName, elementIds] of Object.entries(typeGroups)) {
        const groupId = `GROUP_${storeyIdStr}_${categoryName}`;
        storeyChildren.push(groupId);

        treeMap[groupId] = {
          id: groupId,
          label: categoryName,
          type: "CATEGORYGROUP",
          isGroup: true,
          count: elementIds.length,
          children: elementIds,
          parentId: storeyIdStr,
        };
      }

      treeMap[storeyIdStr] = {
        id: storeyIdStr,
        label: storeyName,
        type: "IFCBUILDINGSTOREY",
        children: storeyChildren,
        parentId: null,
      };
    }

    console.timeEnd("⏱️ Tree Generation Time");
    return { nodes: treeMap, roots: rootIds };
  } catch (error) {
    console.error("Error when getting spatial tree: ", error);
    return { nodes: {}, roots: [] };
  }
};
