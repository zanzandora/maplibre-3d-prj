import { Button } from "../elements/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../elements/Popover";
import ToolButton from "./ToolButton";

const ToolWithPopover = ({
  tool,
  isActive,
  onMainClick,
  activeSubToolId,
  onSubClick,
}) => {
  const activeSubTool = tool.subTools?.find(
    (s) => "id" in s && s.id === activeSubToolId,
  );

  const baseClasses =
    "flex flex-col items-center  h-auto p-2 rounded-lg transition-all";

  // 2. Định nghĩa các biến thể màu sắc (Variants)
  const colorVariants = {
    default:
      "text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover",
    red: "text-red-500 hover:text-red-600 hover:bg-red-500/10",
  };

  // 3. Định nghĩa class khi active
  const activeClasses = "text-bim-primary bg-bim-bg-item-hover shadow-sm";

  // 4. Lấy màu từ object cấu hình của bạn (nếu không có thì dùng default)

  return (
    <Popover>
      <PopoverTrigger
        render={<div className="inline-block" />}
        nativeButton={false}
      >
        <ToolButton
          tool={tool}
          isActive={isActive}
          onClick={onMainClick}
          iconOverride={activeSubTool?.icon}
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto p-2 bg-bim-bg-panel/90 backdrop-blur-md border border-bim-border-main rounded-2xl shadow-xl"
      >
        <div className="flex items-center gap-1.5">
          {tool.subTools?.map((sub, idx) => {
            if ("divider" in sub) {
              return (
                <div
                  key={`sub-div-${idx}`}
                  className="w-px h-4 bg-bim-border-main mx-1"
                />
              );
            }

            const isSubActive = activeSubToolId === sub.id;

            const itemColor = sub.color || "default";

            // 5. Tính toán class cuối cùng
            const currentVariantClasses = isSubActive
              ? activeClasses
              : colorVariants[itemColor] || colorVariants.default;

            return (
              <Button
                key={sub.id}
                onClick={() => {
                  if (sub.onClick) {
                    sub.onClick();
                  } else {
                    onSubClick(sub.id);
                  }
                }}
                variant="ghost"
                size="sm"
                className={`${baseClasses} ${currentVariantClasses}`}
                title={sub.label}
              >
                <sub.icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ToolWithPopover;
