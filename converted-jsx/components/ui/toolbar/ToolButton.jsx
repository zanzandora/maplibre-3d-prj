import { Button } from "../elements/Button";

const ToolButton = ({ tool, isActive, onClick, iconOverride }) => {
  const Icon = iconOverride || tool.icon;
  return (
    <Button
      onClick={onClick}
      variant={isActive ? "default" : "ghost"}
      size="icon"
      className={`rounded-full transition-all ${
        isActive
          ? "shadow-lg shadow-bim-primary/40"
          : "text-bim-text-muted hover:text-bim-text-main"
      }`}
      title={tool.label}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
};

export default ToolButton;
