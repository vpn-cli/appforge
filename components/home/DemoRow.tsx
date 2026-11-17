"use client";

import { motion } from "framer-motion";
import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";

export function DemoRow() {
  return (
    <section className="w-full max-w-[1280px] mx-auto pb-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 items-stretch"
      >
        <DemoCodeCard />
        <DemoPreviewCard />
      </motion.div>
    </section>
  );
}
