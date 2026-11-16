import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Play, Plus, Search } from "lucide-react";

export function ButtonAction({ label, variant = "default", icon }: { label?: string, variant?: "default" | "outline" | "secondary" | "ghost", icon?: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    search: Search,
    play: Play,
    plus: Plus,
    save: Save,
    "arrow-right": ArrowRight
  };

  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <Button 
      variant={variant || "default"} 
      size="sm" 
      className={`rounded-md px-4 h-9 font-medium transition-colors flex items-center ${
        (!variant || variant === "default") && "bg-brand hover:bg-brand-dark text-text-inverse"
      } ${
        variant === "outline" && "border border-border bg-card hover:bg-muted text-foreground"
      } ${
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
      }`}
    >
      {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
      {label || "Action"}
    </Button>
  );
}

