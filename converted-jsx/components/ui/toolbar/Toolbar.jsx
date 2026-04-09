import { Ruler, Scissors, Box, Settings, Square, Trash2 } from "lucide-react";
import { useBIMStore } from "../../../store/useBIMStore";
import SettingsDialog from "../SettingsDialog";
import ToolWithPopover from "./ToolWithPopover";
import ToolButton from "./ToolButton";

export const Toolbar = () => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const activeSubTools = useBIMStore((s) => s.activeSubTools);
  const setActiveTool = useBIMStore((s) => s.setActiveTool);
  const setActiveSubTool = useBIMStore((s) => s.setActiveSubTool);

  const tools = [
    { id: "settings", icon: Settings, label: "Settings" },
    { divider: true },
    {
      id: "measure",
      icon: Ruler,
      label: "Measure",
      subTools: [
        { id: "length", icon: Ruler, label: "Length" },
        { id: "area", icon: Square, label: "Area" },
        { divider: true },
        {
          id: "clear-all",
          icon: Trash2,
          label: "Clear All",
          color: "red",
          onClick: () =>
            window.dispatchEvent(new CustomEvent("bim-measure-delete-all")),
        },
      ],
    },
    { id: "select", icon: Box, label: "Select" },
    { id: "clip", icon: Scissors, label: "Clip" },
  ];

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div className="flex items-center gap-1 p-1.5 bg-bim-bg-panel/80 backdrop-blur-md border border-bim-border-main rounded-full shadow-2xl">
        {tools.map((item, index) => {
          if ("divider" in item) {
            return (
              <div
                key={`div-${index}`}
                className="w-px h-6 bg-bim-border-main mx-1"
              />
            );
          }

          const isActive = activeTool === item.id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const onMainClick = () => setActiveTool(item.id);

          if (item.id === "settings") {
            return <SettingsDialog key={item.id} />;
          }

          if (item.subTools) {
            return (
              <ToolWithPopover
                key={item.id}
                tool={item}
                isActive={isActive}
                onMainClick={onMainClick}
                activeSubToolId={activeSubTools[item.id]}
                onSubClick={(subId) => {
                  setActiveSubTool(item.id, subId);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setActiveTool(item.id);
                }}
              />
            );
          }

          return (
            <ToolButton
              key={item.id}
              tool={item}
              isActive={isActive}
              onClick={onMainClick}
            />
          );
        })}
      </div>
    </div>
  );
};
