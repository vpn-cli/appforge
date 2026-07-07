import { Header } from "./components/Header";
import { ButtonAction } from "./components/ButtonAction";
import { Card } from "./components/Card";
import { Grid } from "./components/Grid";

export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  Header,
  ButtonAction,
  Card,
  Grid,
};

export function RenderNode({ config }: { config: any }) {
  if (!config || typeof config !== 'object') return null;
  
  const { type, ...props } = config;
  
  if (!type) {
    return (
      <div className="p-3 bg-[#FFBD2E]/10 border border-[#FFBD2E]/20 text-[#FFBD2E] text-[11px] font-mono rounded flex flex-col gap-1 my-2">
        <span className="font-bold tracking-widest uppercase">Warning</span>
        <span>A nested component block is missing its "type" identifier.</span>
      </div>
    );
  }

  const Component = ComponentRegistry[type];

  if (!Component) {
    return (
      <div className="p-3 bg-[#FF5F56]/10 border border-[#FF5F56]/20 text-[#FF5F56] text-[11px] font-mono rounded relative overflow-hidden group cursor-help my-2">
        <span className="font-bold mr-1 uppercase">Unknown Component Type:</span> {type}
        <div className="absolute inset-0 bg-[#FF5F56]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return <Component {...props} />;
}

