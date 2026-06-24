"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppWindow } from "lucide-react";
import confetti from "canvas-confetti";

export function Navbar() {
  const [clickCount, setClickCount] = useState(0);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setClickCount(prev => prev + 1);
    
    // Determine precise click coordinates for the confetti origin
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 80,
      spread: 360,
      startVelocity: 25,
      origin: { x, y },
      colors: ['#6C57A4', '#9C87DA', '#ffffff'],
      disableForReducedMotion: true,
      zIndex: 9999,
      scalar: 0.7,
      ticks: 150
    });
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between py-4 border-b border-border relative z-50"
    >
      <Link 
        href="/" 
        className="flex items-center gap-2.5 relative group outline-none"
        onClick={handleLogoClick}
      >
        <motion.div 
          animate={{ rotate: clickCount * 360 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/30 relative overflow-hidden"
        >
           <AppWindow size={22} className="text-white drop-shadow-md relative z-10" />
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
        <span className="font-bold text-xl text-text-primary tracking-tight group-hover:text-brand transition-colors duration-300">
          AppForge
        </span>
      </Link>

      <motion.nav 
        variants={container}
        initial="hidden"
        animate="show"
        className="hidden md:flex items-center gap-6"
      >
        {["Dashboard", "Builder", "Templates"].map((text) => (
          <motion.div key={text} variants={item}>
            <Link 
              href={text === "Builder" ? "/builder/demo" : `/${text.toLowerCase()}`} 
              className="relative text-text-secondary text-sm font-medium hover:text-text-primary transition-colors group px-1 py-2"
            >
              {text}
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out" />
            </Link>
          </motion.div>
        ))}
      </motion.nav>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-4"
      >
        <motion.div variants={item}>
          <Link href="/login" tabIndex={-1}>
            <Button variant="ghost" className="text-sm font-medium hover:bg-surface-secondary">
              Log in
            </Button>
          </Link>
        </motion.div>
        <motion.div variants={item} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/login" tabIndex={-1}>
            <Button className="bg-brand hover:bg-brand-dark text-text-inverse shadow-md shadow-brand/20">
              Start for free
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}
