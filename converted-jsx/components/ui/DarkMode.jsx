import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/theme/ThemeContext";
import { Button } from "./elements/Button";

export const DarkMode = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 rounded-md text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover/50 transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 transform ${
            theme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />

        <Moon
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 transform ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
