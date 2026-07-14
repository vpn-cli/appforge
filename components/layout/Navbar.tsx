"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export function Navbar() {
  const [isHovered, setIsHovered] = useState(false);

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
         <motion.div 
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/30 relative overflow-hidden"
        >
           <AppForgeLogo size={22} isHovered={isHovered} className="text-white drop-shadow-md relative z-10" />
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
        <div className="relative font-bold text-xl tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-dark dark:from-indigo-200 dark:to-purple-300 transition-opacity duration-300 group-hover:opacity-0 relative z-10 block">
            AppForge
          </span>
          <span className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-clip-text text-transparent animate-text-gradient bg-[linear-gradient(to_right,#4C1D95,#7E22CE,#BE185D,#4C1D95)] dark:bg-[linear-gradient(to_right,#C084FC,#F472B6,#818CF8,#C084FC)] bg-[length:200%_auto] z-20 block whitespace-nowrap">
            AppForge
          </span>
        </div>
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
              className="relative text-muted-foreground text-sm font-medium hover:text-foreground transition-colors group px-1 py-2"
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
        <SignedIn>
          <motion.div variants={item} className="flex gap-4 items-center">
            <ThemeToggle />
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 border-2 border-brand/20 shadow-md" } }} />
          </motion.div>
        </SignedIn>
        <SignedOut>
          <motion.div variants={item} className="flex items-center gap-2">
            <ThemeToggle />
          </motion.div>
          <motion.div variants={item}>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button variant="ghost" className="text-sm font-medium hover:bg-muted">
                Log in
              </Button>
            </SignInButton>
          </motion.div>
          <motion.div variants={item} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button className="bg-brand hover:bg-brand-dark text-white shadow-md shadow-brand/20">
                Start for free
              </Button>
            </SignInButton>
          </motion.div>
        </SignedOut>
      </motion.div>
    </motion.header>
  );
}

