import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2" aria-label="Theme toggle">
      {!compact && <Sun size={14} className={isDark ? "text-muted-foreground" : "text-foreground"} />}
      <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
      {!compact && <Moon size={14} className={isDark ? "text-foreground" : "text-muted-foreground"} />}
    </div>
  );
};

export default ThemeToggle;

