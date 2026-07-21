import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Loader2, Send } from "lucide-react";

export function CopilotPanel({ onApply, onStreamStart, onStream, onStreamEnd }: { onApply: (components: unknown[]) => void, onStreamStart?: () => void, onStream?: (text: string) => void, onStreamEnd?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; content: string }[]>([
    { role: "ai", content: "I am ready to build! Ask me to generate headers, grids, buttons, or full dashboard layouts for you." }
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const currentPrompt = prompt;
    setMessages(prev => [...prev, { role: "user", content: currentPrompt }]);
    setPrompt("");

    setIsGenerating(true);
    let streamedText = "";
    
    try {
      if (onStreamStart) onStreamStart();
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream.");
      
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
        
        // Strip markdown if present to ensure clean JSON injection
        const cleanText = streamedText.replace(/```json/g, "").replace(/```/g, "").trim();
        if (onStream) {
           onStream(cleanText);
        }
      }

      const finalText = streamedText.replace(/```json/g, "").replace(/```/g, "").trim();
      if (finalText) {
        onApply(JSON.parse(finalText));
        setMessages(prev => [...prev, { role: "ai", content: "I've updated the canvas with your requested changes!" }]);
      }
    } catch (err) {
      const e = err as Error;
      if (e.message && (e.message.includes("exhausted") || e.message.includes("429"))) {
        setMessages(prev => [...prev, { role: "ai", content: "All configured Gemini API Keys have exhausted their daily quotas. Please add GEMINI_API_KEY_2 to your .env.local file to continue." }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", content: `Sorry, I encountered an error: ${e.message}` }]);
      }
    } finally {
      setIsGenerating(false);
      if (onStreamEnd) onStreamEnd();
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
    <div className="absolute bottom-6 left-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] max-w-[400px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 p-4 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-purple-400" />
           <span className="font-semibold text-foreground text-sm tracking-wide">AppForge Copilot</span>
         </div>
         <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
         </button>
      </div>

      <div className="w-full bg-background/50 h-[300px] max-h-[300px] overflow-y-auto p-4 text-xs font-medium flex flex-col justify-start space-y-4 scroll-smooth">
         {messages.map((m, i) => (
           <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div 
               className={`p-3 max-w-[85%] shadow-sm ${
                 m.role === 'user' 
                   ? 'bg-purple-600 text-white text-left rounded-2xl' 
                   : 'bg-muted border border-white/5 text-foreground rounded-2xl'
               }`}
               style={{
                 borderTopRightRadius: m.role === 'user' ? '4px' : undefined,
                 borderTopLeftRadius: m.role === 'ai' ? '4px' : undefined,
                 border: m.role === 'user' ? '1px solid rgba(192, 132, 252, 0.5)' : undefined
               }}
             >
                {m.role === 'ai' && i === 0 && (
                  <div className="flex items-center gap-1.5 mb-1 text-purple-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">AppForge</span>
                  </div>
                )}
                <span className="leading-relaxed whitespace-pre-wrap">{m.content}</span>
             </div>
           </div>
         ))}
         {isGenerating && (
           <div className="flex w-full justify-start">
             <div className="bg-muted border border-border text-foreground rounded-2xl rounded-tl-sm p-3 inline-flex items-center gap-2.5 shadow-sm max-w-[85%]">
               <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
               <span className="leading-relaxed">Synthesizing UI...</span>
             </div>
           </div>
         )}
      </div>

      <form onSubmit={handleGenerate} className="p-3 border-t border-border bg-card flex items-center gap-2">
        <input 
           type="text" 
           value={prompt}
           onChange={e => setPrompt(e.target.value)}
           placeholder="e.g. Generate a dark-mode CRM interface... (Testing Hot Reload)"
           className="flex-1 bg-muted border border-border rounded-full h-10 px-4 text-sm text-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
           disabled={isGenerating}
        />
        <Button 
           type="submit" 
           disabled={isGenerating || !prompt.trim()}
           size="icon"
           className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 shadow-md shadow-purple-600/20"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
        </Button>
      </form>
    </div>
  );
}

