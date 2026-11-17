"use client";

import { motion } from "framer-motion";
import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";

export function DemoRow() {
  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 pt-1 pb-10 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-[1.12fr_1fr] gap-6 items-stretch"
      >
        <DemoCodeCard />
        <DemoPreviewCard />
      </motion.div>
    </section>
  );
}
