"use client";

import { motion } from "framer-motion";

export function AppForgeLogo({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* Top Diamond */}
      <motion.path
        d="M50 15 L80 30 L50 45 L20 30 Z"
        fill="currentColor"
        variants={{
          rest: { y: 0, opacity: 1 },
          hover: { y: -8, scale: 1.1, opacity: 0.9 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Left Diamond (Shadow Side) */}
      <motion.path
        d="M20 35 L50 50 L50 85 L20 70 Z"
        fill="currentColor"
        className="opacity-70"
        variants={{
          rest: { x: 0, y: 0 },
          hover: { x: -5, y: 5 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Right Diamond (Lit Side) */}
      <motion.path
        d="M80 35 L50 50 L50 85 L80 70 Z"
        fill="currentColor"
        className="opacity-50"
        variants={{
          rest: { x: 0, y: 0 },
          hover: { x: 5, y: 5 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Central Spark / Energy */}
      <motion.circle
        cx="50"
        cy="40"
        r="4"
        fill="#FFFFFF"
        variants={{
          rest: { scale: 0, opacity: 0 },
          hover: { scale: 1.5, opacity: 1, y: -10 }
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 10,
          mass: 0.5,
          delay: 0.1
        }}
      />
    </motion.svg>
  );
}
