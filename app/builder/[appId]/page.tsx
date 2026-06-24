"use client";

import { use, useState, useEffect } from "react";
import { ConfigEditor } from "@/components/builder/ConfigEditor";
import { LivePreview } from "@/components/builder/LivePreview";
import { ValidationPanel } from "@/components/builder/ValidationPanel";
import { validateConfig } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner isn't installed yet, we'll replace with a basic alert for now, or just UI change.

const defaultMockConfig = JSON.stringify({
  app: "My First App",
  pages: [
    {
      components: [
        { type: "Header", title: "New Dashboard" }
      ]
    }
  ]
}, null, 2);

export default function BuilderPage() {
  const params = useParams();
  const appId = params.appId as string;
  
  const [configStr, setConfigStr] = useState(defaultMockConfig);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Continuously validate JSON on every change
  useEffect(() => {
    const results = validateConfig(configStr);
    setErrors(results.errors);
    setWarnings(results.warnings);
  }, [configStr]);

  const handleSave = () => {
    setIsSaving(true);
    // Fake Mock Save Delay 
    setTimeout(() => {
      setIsSaving(false);
      // Temporarily use browser alert since shadcn toast isn't verified installed
      alert("App Config saved successfully!"); 
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Builder Toolbar */}
      <div className="h-14 border-b border-border bg-surface shrink-0 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-surface-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-primary leading-tight">App Builder</span>
            <span className="text-[10px] text-text-muted font-mono">{appId}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center text-xs text-text-muted mr-4">
             {errors.length > 0 ? (
               <span className="text-[#FF5F56] font-medium flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-[#FF5F56] before:rounded-full before:mr-2">Has Errors</span>
             ) : (
               <span className="text-[#27C93F] font-medium flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-[#27C93F] before:rounded-full before:mr-2">Ready</span>
             )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 bg-surface-secondary border-border hover:bg-surface hover:text-text-primary font-medium text-xs transition-colors"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            Save Draft
          </Button>
          <Button size="sm" className="h-8 bg-brand hover:bg-brand-dark text-text-inverse font-medium text-xs shadow-md shadow-brand/20">
            <Play className="w-3.5 h-3.5 mr-2 fill-current" />
            Publish
          </Button>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Editor & Validation */}
        <div className="w-1/2 flex flex-col min-w-[300px] border-r border-border bg-surface/50">
          <div className="flex-1 min-h-0 relative">
             <ConfigEditor 
               value={configStr} 
               onChange={(val) => setConfigStr(val || "")} 
             />
          </div>
          <div className="h-48 shrink-0">
             <ValidationPanel errors={errors} warnings={warnings} />
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-1/2 min-w-[300px] bg-background">
          <LivePreview configStr={configStr} />
        </div>
      </div>
    </div>
  );
}
