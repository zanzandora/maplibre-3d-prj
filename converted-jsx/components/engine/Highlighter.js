/* eslint-disable @typescript-eslint/no-explicit-any */
import { Color } from "three";

/**
 * Cấu hình bộ công cụ Highlighter để xử lý việc chọn đối tượng trong scene 3D.
 * Đồng bộ hóa dữ liệu thuộc tính và trạng thái lựa chọn với cây thư mục (Spatial Tree).
 */
export const setupHighlighter = (
  highlighter,
  world,
  fragments,
  setSelectedElement,
  setIsHighlighting,
  setSelectedNodeId,
) => {
  // Chỉ cấu hình nếu chưa được thiết lập (tránh reset material liên tục)
  if (!highlighter.isSetup) {
    highlighter.setup({
      world,
      selectMaterialDefinition: {
        color: new Color("#bcf124"),
        opacity: 1,
        transparent: false,
        renderedFaces: 0,
      },
    });
  }

  // Quan trọng: Bật highlighter để lắng nghe các sự kiện click trên scene
  highlighter.enabled = true;
  highlighter.zoomToSelection = true;

  /*
    Xử lý khi một đối tượng được highlight (chọn) trên 3D.
    1. Lấy ID để đồng bộ với Tree BIM.
    2. Truy vấn dữ liệu thuộc tính (Properties/Psets) từ model fragments.
  */
  const onHighlight = async (modelIdMap) => {
    setIsHighlighting(true);
    try {
      const promises = [];
      let firstExpressId = null;

      for (const [modelId, localIds] of Object.entries(modelIdMap)) {
        const model = fragments.list.get(modelId);
        if (!model) continue;

        // Lấy ID đầu tiên để đồng bộ với cây BIM ngay lập tức
        if (firstExpressId === null && localIds.size > 0) {
          firstExpressId = Array.from(localIds)[0];
        }
      }

      // Cập nhật trạng thái Node đang chọn trên UI Tree
      // Chỉ tự động chọn trên Tree nếu highlight duy nhất 1 đối tượng (thường là click 3D)
      // Nếu highlight nhiều đối tượng (chọn từ Group/Storey), giữ nguyên selection hiện tại trên Tree.
      const totalSelected = Object.values(modelIdMap).reduce(
        (acc, ids) => acc + ids.size,
        0,
      );

      // Optimize: Only fetch detailed properties if a single element is selected to avoid freezing the UI.
      if (totalSelected === 1 && firstExpressId !== null) {
        setSelectedNodeId(firstExpressId);

        for (const [modelId, localIds] of Object.entries(modelIdMap)) {
          const model = fragments.list.get(modelId);
          if (!model) continue;

          // Truy vấn dữ liệu chi tiết và các quan hệ Property Set
          promises.push(
            model.getItemsData([...localIds], {
              attributesDefault: true,
              relations: {
                IsDefinedBy: {
                  attributes: true,
                  relations: true,
                },
                HasProperties: {
                  attributes: true,
                  relations: true,
                },
              },
            }),
          );
        }
      } else if (totalSelected > 1) {
        // Clear properties if selecting multiple elements
        setSelectedElement(null);
        return; // Early return, don't fetch any data
      }

      const data = (await Promise.all(promises)).flat();

      if (data.length > 0) {
        const item = data[0];

        // 1. Xử lý Property Sets (Psets)
        const psets = {};
        if (item.IsDefinedBy && Array.isArray(item.IsDefinedBy)) {
          for (const pset of item.IsDefinedBy) {
            const psetName = pset.Name?.value || "Common Properties";
            const props = {};
            if (pset.HasProperties && Array.isArray(pset.HasProperties)) {
              for (const prop of pset.HasProperties) {
                const name = prop.Name?.value;
                let val = prop.NominalValue?.value;
                if (name && val !== undefined) {
                  if (typeof val === "number") {
                    val = Number(val.toFixed(2));
                  }
                  props[name] = val;
                }
              }
            }
            psets[psetName] = props;
          }
        }

        // 2. Xử lý các thuộc tính trực tiếp (Direct Attributes)
        const flatAttributes = {};
        for (const [key, val] of Object.entries(item)) {
          if (key === "IsDefinedBy") continue;

          if (val && typeof val === "object" && "value" in val) {
            flatAttributes[key] = val.value;
          } else {
            flatAttributes[key] = val;
          }
        }

        setSelectedElement({
          ...flatAttributes,
          psets,
        });
      }
    } catch (e) {
      console.error("Highlighter Error:", e);
    } finally {
      setIsHighlighting(false);
    }
  };

  /*
    Xóa trạng thái lựa chọn khi click ra ngoài hoặc Clear Highlighter.
  */
  const onClear = () => {
    setSelectedElement(null);
    setSelectedNodeId(null);
  };

  highlighter.events.select.onHighlight.add(onHighlight);
  highlighter.events.select.onClear.add(onClear);

  return () => {
    highlighter.enabled = false;
    highlighter.events.select.onHighlight.remove(onHighlight);
    highlighter.events.select.onClear.remove(onClear);
    // Lưu ý: Không dispose highlighter ở đây nếu nó được quản lý bởi Components
  };
};
