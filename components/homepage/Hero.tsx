"use client";

import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {


  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <section className="w-full relative overflow-hidden min-h-[110vh] pb-32">
      {/* 1. Deep Atmospheric Glows (The "Mesh" inside the grid) */}
      <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand/[0.03] dark:bg-brand/10 blur-[120px] bg-blob-1 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-success/[0.03] dark:bg-success/[0.05] blur-[100px] bg-blob-2 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen" />

      {/* 2. Full-Width Architectural Grid Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-grid-pattern mask-vignette" />

      {/* 3. Hero Content (Top Layer) */}
      <div className="max-w-7xl mx-auto px-4 py-24 text-center relative group/hero z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent animate-text-gradient bg-[linear-gradient(to_right,#4C1D95,#7E22CE,#BE185D,#4C1D95)] dark:bg-[linear-gradient(to_right,#C084FC,#F472B6,#818CF8,#C084FC)]"
          >
            Live Config-driven Apps
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Write a single JSON configuration describing your data and UI. AppForge
            instantly renders a working application, complete with a database,
            dynamic APIs, and zero boilerplate.
          </motion.p>
          <motion.div 
            variants={itemVariants}
            className="flex justify-center gap-4 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/builder/demo" tabIndex={-1}>
                <Button size="lg" className="bg-brand hover:bg-brand-dark text-white px-8 shadow-[0_10px_25px_-5px_rgba(156,135,218,0.4)] hover:shadow-[0_20px_35px_-5px_rgba(156,135,218,0.6)] transition-all duration-300">
                  Start Building
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/templates" tabIndex={-1}>
                <Button size="lg" variant="outline" className="border-border text-foreground px-8 bg-card hover:bg-muted shadow-md hover:shadow-lg transition-all duration-300">
                  View Templates
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Split screen graphic */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ 
            boxShadow: '0 30px 60px -12px rgba(108,87,164,0.25), 0 18px 36px -18px rgba(0,0,0,0.1)' 
          }}
          data-cursor="hero"
          className="bg-card rounded-xl border border-border shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1),0_5px_15px_-5px_rgba(108,87,164,0.1)] flex flex-col md:flex-row overflow-hidden text-left min-h-[440px] transition-all duration-500 relative z-10 w-full"
        >
          {/* Editor Side: Full Mac Window Pane */}
          <div className="w-full md:w-1/2 min-w-0 bg-[#1a1b24]/90 backdrop-blur-xl border-b md:border-b-0 md:border-r border-border relative flex flex-col font-mono overflow-hidden">
            {/* Traffic Light Menu Bar */}
            <div className="h-12 bg-[#2d2d33]/50 border-b border-white/5 flex items-center px-5 relative shrink-0">
              <div className="flex gap-[6px]">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-white/30 text-xs tracking-widest font-semibold">app.config.json</span>
              </div>
            </div>
            
            {/* Code */}
            <div className="p-8 md:p-10 overflow-x-auto flex-1 relative flex items-center">
              <pre className="text-sm md:text-[15px] leading-loose text-[#D4D4D4]">
{`{
  "app": "ops_dashboard",
  "pages": [{
    "components": [
      { "type": "Metric", "title": "Active Workflows" },
      { "type": "DataTable", "entity": "workflows" }
    ]
  }]
}`}
              </pre>
            </div>
          </div>
          
          {/* Rendered Side */}
          <div className="w-full md:w-1/2 min-w-0 bg-muted/60 p-6 md:p-8 relative flex flex-col justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-surface-secondary pointer-events-none rounded-r-xl" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-1.5 bg-brand text-white rounded-md shadow-lg shadow-brand/20">
                <LayoutTemplate size={16} />
              </div>
              <h3 className="m-0 text-sm font-bold text-foreground tracking-wider uppercase text-brand">
                Rendered Application
              </h3>
            </div>
            
            <div className="flex flex-col gap-6 relative z-10">
              {/* Metric Card - Eye Candy */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card p-6 rounded-xl border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(108,87,164,0.15)] transition-all duration-500 transform hover:-translate-y-1 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                  <div className="w-12 h-12 rounded-full border-2 border-brand/20 flex items-center justify-center">
                    <span className="text-brand font-extrabold text-xl">👥</span>
                  </div>
                </div>
                
                <div className="flex flex-col relative z-10">
                  <span className="text-slate-400 text-sm font-medium tracking-wide flex items-center gap-2">
                    Active Workflows
                  </span>
                  <div className="flex items-baseline gap-4 mt-2">
                    <div className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-text-primary to-slate-400 tracking-tighter drop-shadow-sm">
                      1,244
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#27C93F] bg-[#27C93F]/10 px-2 py-0.5 rounded-full border border-[#27C93F]/20 shadow-[0_0_10px_rgba(39,201,63,0.1)]">
                      +12% 
                    </span>
                  </div>
                </div>
              </motion.div>
              
              {/* Table Card - Eye Candy */}
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="bg-card rounded-xl border border-white/5 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(108,87,164,0.1)] transition-all duration-500 transform hover:-translate-y-1"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border/50 backdrop-blur-md">
                      <tr>
                        <th className="px-5 py-4 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Workflow</th>
                        <th className="px-5 py-4 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Trigger</th>
                        <th className="px-5 py-4 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50 hover:bg-muted transition-colors group cursor-pointer">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand/20">US</div>
                            <span className="font-semibold text-foreground group-hover:text-brand transition-colors">User Sync</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">cron:hourly</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#27C93F]/10 text-[#27C93F] border border-[#27C93F]/20 shadow-[0_0_8px_rgba(39,201,63,0.1)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" /> Running
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted transition-colors group cursor-pointer">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-foreground text-xs font-bold">IG</div>
                            <span className="font-semibold text-foreground group-hover:text-brand transition-colors">Invoice Gen</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">webhook:rx</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent text-slate-400 border border-white/5">
                            <div className="w-1 h-1 rounded-full bg-slate-500" /> Idle
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

