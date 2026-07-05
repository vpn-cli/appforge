import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2, Send } from "lucide-react";

export function CopilotPanel({ onApply }: { onApply: (components: any[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate.");

      if (data.components) {
        onApply(data.components);
        setPrompt("");
      }
    } catch (e: any) {
      alert("Copilot Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 left-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 rounded-full px-6 h-12 flex gap-2 font-medium"
      >
        <Sparkles className="w-5 h-5" />
        Ask AI
      </Button>
    );
  }

  return (
    <div className="absolute bottom-6 left-6 z-50 w-[400px] bg-surface border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 p-4 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-purple-400" />
           <span className="font-semibold text-text-primary text-sm tracking-wide">AppForge Copilot</span>
         </div>
         <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
         </button>
      </div>

      <div className="p-4 bg-background/50 h-32 overflow-y-auto text-xs text-text-muted flex flex-col justify-end">
          <div className="bg-surface-secondary/50 rounded-lg p-3 border border-white/5 inline-block w-[85%] mb-2 self-start rounded-tl-sm">
             I am ready to build! Ask me to generate headers, grids, buttons, or full dashboard layouts for you.
          </div>
      </div>

      <form onSubmit={handleGenerate} className="p-3 border-t border-border bg-surface flex items-center gap-2">
        <input 
           type="text" 
           value={prompt}
           onChange={e => setPrompt(e.target.value)}
           placeholder="e.g. Generate a dark-mode CRM interface..."
           className="flex-1 bg-surface-secondary border border-border rounded-full h-10 px-4 text-sm text-text-primary focus:outline-none focus:border-purple-500/50 transition-colors"
           disabled={isGenerating}
        />
        <Button 
           type="submit" 
           disabled={isGenerating || !prompt.trim()}
           size="icon"
           className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 shadow-md shadow-purple-600/20"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
