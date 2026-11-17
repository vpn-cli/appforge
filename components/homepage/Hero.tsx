"use client";

import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RenderNode } from "@/registry";

const demoConfig = {
  app: "ops_dashboard",
  pages: [
    {
      components: [
        {
          type: "Statistic",
          label: "Active Workflows",
          value: 1244,
          trend: {
            value: "+12%",
            sentiment: "positive" as const,
          },
        },
        {
          type: "DataTable",
          columns: [
            { key: "workflow", label: "Workflow", type: "avatar" as const },
            { key: "trigger", label: "Trigger", type: "code" as const },
            { key: "status", label: "Status", type: "badge" as const },
          ],
          data: [
            { workflow: "User Sync", trigger: "cron:hourly", status: "Running" },
            { workflow: "Invoice Gen", trigger: "webhook:rx", status: "Idle" },
          ],
        },
      ],
    },
  ],
};

export function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="w-full relative overflow-hidden min-h-[110vh] pb-32">
      <div className="max-w-7xl mx-auto px-4 py-24 text-center relative z-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-foreground"
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
            <div>
              <Button
                size="lg"
                variant="primary"
                showArrow
                render={<Link href="/builder/demo" />}
              >
                Start Building
              </Button>
            </div>
            <div>
              <Button
                size="lg"
                variant="secondary"
                render={<Link href="/templates" />}
              >
                View Templates
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Split screen graphic */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card rounded-xl border border-border flex flex-col md:flex-row overflow-hidden text-left min-h-[440px] relative z-10 w-full"
        >
          {/* Editor Side: Mac Window Pane */}
          <div className="w-full md:w-1/2 min-w-0 bg-card border-b md:border-b-0 md:border-r border-border relative flex flex-col font-mono overflow-hidden">
            {/* Window Chrome with neutral dots in --border-strong */}
            <div className="h-11 bg-muted/40 border-b border-border flex items-center px-4 relative shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border border-border-strong bg-transparent" />
                <div className="w-3 h-3 rounded-full border border-border-strong bg-transparent" />
                <div className="w-3 h-3 rounded-full border border-border-strong bg-transparent" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-muted-foreground text-xs font-medium">app.config.json</span>
              </div>
            </div>

            {/* Syntax-highlighted code matching builder editor theme tokens */}
            <div className="p-6 md:p-8 overflow-x-auto flex-1 flex items-center">
              <pre className="text-xs md:text-[13px] leading-relaxed font-mono">
                <code>
                  <span className="text-muted-foreground">{"{"}</span>
                  {"\n  "}<span className="text-accent">&quot;app&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;ops_dashboard&quot;</span><span className="text-muted-foreground">,</span>
                  {"\n  "}<span className="text-accent">&quot;pages&quot;</span><span className="text-muted-foreground">: [</span>
                  {"\n    "}<span className="text-muted-foreground">{"{"}</span>
                  {"\n      "}<span className="text-accent">&quot;components&quot;</span><span className="text-muted-foreground">: [</span>
                  {"\n        "}<span className="text-muted-foreground">{"{"}</span>
                  {"\n          "}<span className="text-accent">&quot;type&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;Statistic&quot;</span><span className="text-muted-foreground">,</span>
                  {"\n          "}<span className="text-accent">&quot;label&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;Active Workflows&quot;</span><span className="text-muted-foreground">,</span>
                  {"\n          "}<span className="text-accent">&quot;value&quot;</span><span className="text-muted-foreground">: </span><span className="text-warning-text">1244</span><span className="text-muted-foreground">,</span>
                  {"\n          "}<span className="text-accent">&quot;trend&quot;</span><span className="text-muted-foreground">: {"{"} </span><span className="text-accent">&quot;value&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;+12%&quot;</span><span className="text-muted-foreground">, </span><span className="text-accent">&quot;sentiment&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;positive&quot;</span><span className="text-muted-foreground"> {"}"}</span>
                  {"\n        "}<span className="text-muted-foreground">{"}"},</span>
                  {"\n        "}<span className="text-muted-foreground">{"{"}</span>
                  {"\n          "}<span className="text-accent">&quot;type&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;DataTable&quot;</span><span className="text-muted-foreground">,</span>
                  {"\n          "}<span className="text-accent">&quot;columns&quot;</span><span className="text-muted-foreground">: [</span>
                  {"\n            "}<span className="text-muted-foreground">{"{"} </span><span className="text-accent">&quot;key&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;workflow&quot;</span><span className="text-muted-foreground">, </span><span className="text-accent">&quot;type&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;avatar&quot;</span><span className="text-muted-foreground"> {"}"},</span>
                  {"\n            "}<span className="text-muted-foreground">{"{"} </span><span className="text-accent">&quot;key&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;trigger&quot;</span><span className="text-muted-foreground">, </span><span className="text-accent">&quot;type&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;code&quot;</span><span className="text-muted-foreground"> {"}"},</span>
                  {"\n            "}<span className="text-muted-foreground">{"{"} </span><span className="text-accent">&quot;key&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;status&quot;</span><span className="text-muted-foreground">, </span><span className="text-accent">&quot;type&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;badge&quot;</span><span className="text-muted-foreground"> {"}"}</span>
                  {"\n          "}<span className="text-muted-foreground">],</span>
                  {"\n          "}<span className="text-accent">&quot;data&quot;</span><span className="text-muted-foreground">: [</span>
                  {"\n            "}<span className="text-muted-foreground">{"{"} </span><span className="text-accent">&quot;workflow&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;User Sync&quot;</span><span className="text-muted-foreground">, </span><span className="text-accent">&quot;status&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;Running&quot;</span><span className="text-muted-foreground"> {"}"},</span>
                  {"\n            "}<span className="text-muted-foreground">{"{"} </span><span className="text-accent">&quot;workflow&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;Invoice Gen&quot;</span><span className="text-muted-foreground">, </span><span className="text-accent">&quot;status&quot;</span><span className="text-muted-foreground">: </span><span className="text-success-text">&quot;Idle&quot;</span><span className="text-muted-foreground"> {"}"}</span>
                  {"\n          "}<span className="text-muted-foreground">]</span>
                  {"\n        "}<span className="text-muted-foreground">{"}"}</span>
                  {"\n      "}<span className="text-muted-foreground">]</span>
                  {"\n    "}<span className="text-muted-foreground">{"}"}</span>
                  {"\n  "}<span className="text-muted-foreground">]</span>
                  {"\n"}<span className="text-muted-foreground">{"}"}</span>
                </code>
              </pre>
            </div>
          </div>

          {/* Rendered Side: Real Registry Renderers */}
          <div className="w-full md:w-1/2 min-w-0 bg-muted/30 p-5 md:p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Preview</span>
            </div>

            <div className="flex flex-col gap-4">
              {demoConfig.pages[0].components.map((comp, idx) => (
                <RenderNode key={idx} config={comp} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
