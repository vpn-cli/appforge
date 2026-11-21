import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Play, Plus, Search } from "lucide-react";

export function ButtonAction({
  label,
  variant = "default",
  icon,
}: {
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: string;
}) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    search: Search,
    play: Play,
    plus: Plus,
    save: Save,
    "arrow-right": ArrowRight,
  };

  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <Button
      variant={variant || "default"}
      size="sm"
      className={`rounded-md px-2.5 h-7 text-xs font-medium transition-colors flex items-center min-w-0 max-w-full ${
        (!variant || variant === "default") &&
        "bg-brand hover:bg-brand-dark text-text-inverse"
      } ${
        variant === "outline" &&
        "border border-border bg-card hover:bg-muted text-foreground"
      } ${
        variant === "secondary" &&
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
      } ${
        variant === "ghost" &&
        "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {IconComponent && <IconComponent className="w-3 h-3 mr-1.5 shrink-0" />}
      <span className="truncate min-w-0" title={label || "Action"}>
        {label || "Action"}
      </span>
    </Button>
  );
}
