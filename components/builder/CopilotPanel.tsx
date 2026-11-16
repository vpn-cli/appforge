import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Send } from "lucide-react";

export function CopilotPanel({
  onApply,
  onStreamStart,
  onStream,
  onStreamEnd,
  initialPrompt,
}: {
  onApply: (components: unknown[]) => void;
  onStreamStart?: () => void;
  onStream?: (text: string) => void;
  onStreamEnd?: () => void;
  initialPrompt?: string;
}) {
  const [isOpen, setIsOpen] = useState(!!initialPrompt);
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setIsOpen(true);
    }
  }, [initialPrompt]);
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
        body: JSON.stringify({ prompt }),
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

        // Pass the raw chunk stream directly to the UI without heavy parsing
        if (onStream) {
          onStream(streamedText);
        }
      }

      // 1. Strip conversational filler and markdown blocks by precisely isolating the JSON array/object
      let finalText = streamedText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const firstBrace = finalText.indexOf("{");
      const firstBracket = finalText.indexOf("[");
      const isArrayFirst =
        firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);

      const first = isArrayFirst ? firstBracket : firstBrace;
      const last = isArrayFirst
        ? finalText.lastIndexOf("]")
        : finalText.lastIndexOf("}");

      if (first !== -1 && last !== -1 && last > first) {
        finalText = finalText.substring(first, last + 1);
      }

      if (finalText) {
        let parsed = JSON.parse(finalText);

        // 2. Unpack double-stringified LLM JSON artifacts
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }

        // 3. Drill down if it hallucinated the overarching registry structure
        if (parsed?.pages?.[0]?.components) {
          parsed = parsed.pages[0].components;
        } else if (parsed?.components && Array.isArray(parsed.components)) {
          parsed = parsed.components;
        }

        // 4. Force strict schema structure for the UI array
        const finalArray = Array.isArray(parsed) ? parsed : [parsed];

        onApply(finalArray);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "I've correctly compiled the new canvas UI from the generated AST!",
          },
        ]);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tagName = target.tagName.toLowerCase();
          const isInput = tagName === "input" || tagName === "textarea" || target.isContentEditable;
          const isEditor = target.closest(".monaco-editor, .cm-editor, [data-code-editor], textarea");
          if (isInput || isEditor) return;
        }
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 left-6 z-50 bg-brand hover:bg-brand-dark text-text-inverse shadow-lg border border-border rounded-lg px-3.5 h-9 flex items-center gap-2 font-medium text-xs transition-colors"
      >
        <span>Copilot</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/20 dark:bg-black/30 rounded border border-white/20 text-text-inverse/90">⌘K</kbd>
      </Button>
    );
  }

  return (
    <div className="absolute bottom-6 left-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] max-w-[400px] bg-card border border-border shadow-xl rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-150">
      <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
         <div className="flex items-center gap-2">
           <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Copilot</span>
           <span className="text-[10px] font-mono text-muted-foreground border border-border/60 px-1 py-0.5 rounded">⌘K</span>
         </div>
         <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted" aria-label="Close Copilot">
            <X className="w-3.5 h-3.5" />
         </button>
      </div>

      <div data-lenis-prevent className="w-full bg-background/50 h-[300px] max-h-[300px] overflow-y-auto p-4 text-xs font-medium flex flex-col justify-start space-y-4 scroll-smooth">
         {messages.map((m, i) => (
           <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div 
               className={`p-3 max-w-[85%] text-xs leading-relaxed rounded-md border ${
                 m.role === 'user' 
                   ? 'bg-brand text-text-inverse border-brand' 
                   : 'bg-muted border-border text-foreground'
               }`}
             >
                <span className="leading-relaxed whitespace-pre-wrap">{m.content}</span>
             </div>
           </div>
         ))}
         {isGenerating && (
           <div className="flex w-full justify-start">
             <div className="bg-muted border border-border text-foreground rounded-md p-2.5 inline-flex items-center gap-2 text-xs">
               <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
               <span>Synthesizing UI schema...</span>
             </div>
           </div>
         )}
      </div>

      <form 
        onSubmit={(e) => { e.preventDefault(); void handleGenerate(e); }} 
        className="p-3 border-t border-border bg-card flex items-end gap-2"
      >
        <textarea 
           data-lenis-prevent
           value={prompt}
           onChange={e => setPrompt(e.target.value)}
           onKeyDown={e => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               void handleGenerate(e);
             }
           }}
           placeholder="e.g. Generate an incident dashboard with metrics..."
           className="flex-1 bg-muted border border-border rounded-md min-h-[38px] max-h-[100px] py-2 px-3 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors overflow-y-auto leading-relaxed"
           disabled={isGenerating}
           rows={prompt.length > 50 ? 2 : 1}
        />
        <Button 
           type="submit" 
           disabled={isGenerating || !prompt.trim()}
           size="sm"
           className="h-[38px] px-3 rounded-md bg-brand hover:bg-brand-dark text-text-inverse flex-shrink-0 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </form>
    </div>
  );
}

