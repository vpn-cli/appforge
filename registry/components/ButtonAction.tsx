import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Play, Plus, Search } from "lucide-react";

export function ButtonAction({ label, variant = "default", icon, size = "default" }: { label?: string, variant?: "default" | "outline" | "secondary" | "ghost", icon?: string, size?: "default" | "sm" | "lg" | "icon" }) {
  const IconMap: Record<string, any> = {
    "arrow-right": ArrowRight,
    "save": Save,
    "play": Play,
    "plus": Plus,
    "search": Search,
  };
  
  const IconComponent = icon ? IconMap[icon] : null;

  return (
    <Button variant={variant} size={size} className="gap-2 font-medium">
      {IconComponent && <IconComponent className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      {label || (icon && !label ? "" : "Action")}
    </Button>
  );
}
