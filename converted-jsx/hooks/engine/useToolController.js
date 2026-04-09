import { useEffect } from "react";
import * as OBC from "@thatopen/components";
import { Highlighter } from "@thatopen/components-front";
import { useBIMStore } from "../../store/useBIMStore";
import { setupHighlighter } from "../../components/engine/Highlighter";
import { setupClipper } from "../../components/engine/Clipper";
import { setupMeasure } from "../../components/engine/Measure";
import { UNIT_OPTIONS } from "../../store/slices/measureSlice";

export const useToolController = ({
  components,
  world,
  fragments,
  container,
  isReady,
}) => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const activeSubTools = useBIMStore((s) => s.activeSubTools);

  const setSelectedElement = useBIMStore((s) => s.setSelectedElement);
  const setSelectedNodeId = useBIMStore((s) => s.setSelectedNodeId);
  const setIsHighlighting = useBIMStore((s) => s.setIsHighlighting);

  const measureBaseUnitIndex = useBIMStore((s) => s.measureBaseUnitIndex);
  const measurePrecision = useBIMStore((s) => s.measurePrecision);

  useEffect(() => {
    // Chỉ chạy khi engine đã khởi tạo xong
    if (!isReady || !components || !world || !container || !fragments) return;

    const clipper = components.get(OBC.Clipper);
    const highlighter = components.get(Highlighter);

    let cleanup;

    switch (activeTool) {
      case "select":
        cleanup = setupHighlighter(
          highlighter,
          world,
          fragments,
          setSelectedElement,
          setIsHighlighting,
          setSelectedNodeId,
        );
        break;
      case "clip":
        cleanup = setupClipper(clipper, world, container);
        break;
      case "measure": {
        const subTool = activeSubTools["measure"] || "length";
        const unit = UNIT_OPTIONS[subTool][measureBaseUnitIndex];
        cleanup = setupMeasure(
          components,
          world,
          container,
          subTool,
          fragments,
          unit,
          measurePrecision,
        );
        break;
      }
      default:
        // Tắt các tool đặc thù khi không kích hoạt
        clipper.enabled = false;
        clipper.visible = false;
        break;
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [
    isReady,
    components,
    world,
    fragments,
    container,
    activeTool,
    activeSubTools,
    setSelectedElement,
    setSelectedNodeId,
    setIsHighlighting,
    measureBaseUnitIndex,
    measurePrecision,
  ]);
};
