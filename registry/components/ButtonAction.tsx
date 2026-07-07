import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Play, Plus, Search } from "lucide-react";

export function ButtonAction({ label, variant = "default", icon, size = "default" }: { label?: string, variant?: "default" | "outline" | "secondary" | "ghost", icon?: string, size?: "default" | "sm" | "lg" | "icon" }) {
  const iconMap: Record<string, React.FC<any>> = {
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
      className={`rounded-full px-5 py-4 font-semibold transition-all duration-300 active:scale-95 flex items-center ${
        (!variant || variant === "default") && "shadow-[0_10px_25px_-5px_rgba(156,135,218,0.3)] hover:shadow-[0_20px_35px_-5px_rgba(156,135,218,0.5)] hover:-translate-y-0.5 bg-brand hover:bg-brand-dark text-background text-brand-foreground"
      } ${
        variant === "outline" && "shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm border-border/60 hover:border-brand/30"
      } ${
        variant === "secondary" && "hover:-translate-y-0.5 shadow-sm hover:shadow-md"
      }`}
    >
      {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
      {label || "Action"}
    </Button>
  );
}

