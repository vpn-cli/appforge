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
    <Button variant={variant || "default"} size="sm" className="rounded-full px-5 py-4 font-semibold shadow-none transition-transform active:scale-95">
      {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
      {label || "Action"}
    </Button>
  );
}
