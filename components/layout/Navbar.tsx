"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between py-4 border-b border-border relative z-50 bg-background"
    >
      <Link 
        href="/" 
        className="flex items-center gap-2.5 relative group outline-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-foreground relative overflow-hidden">
          <AppForgeLogo size={18} isHovered={isHovered} className="text-foreground relative z-10" />
        </div>
        <div className="font-bold text-lg tracking-tight text-foreground transition-colors">
          AppForge
        </div>
      </Link>

      {/* Desktop Links */}
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
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out" />
            </Link>
          </motion.div>
        ))}
      </motion.nav>

      {/* Desktop Actions & Mobile Trigger */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2 sm:gap-4"
      >
        <SignedIn>
          <motion.div variants={item} className="flex gap-2 sm:gap-4 items-center">
            <ThemeToggle />
            <OrganizationSwitcher appearance={{ elements: { organizationSwitcherTrigger: "border border-border bg-muted/50 rounded-md py-1.5 px-3 text-sm font-medium text-foreground", organizationPreviewAvatarBox: "bg-muted text-foreground border border-border" } }} />
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 border border-border bg-muted text-foreground" } }} />
          </motion.div>
        </SignedIn>
        
        <SignedOut>
          <motion.div variants={item} className="flex items-center gap-2">
            <ThemeToggle />
          </motion.div>
          <motion.div variants={item} className="hidden sm:block">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button variant="ghost" size="md">
                Log in
              </Button>
            </SignInButton>
          </motion.div>
          <motion.div variants={item} className="hidden sm:block" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button variant="primary" size="md">
                Start for free
              </Button>
            </SignUpButton>
          </motion.div>
        </SignedOut>

        {/* Mobile Hamburger Toggle */}
        <motion.button
          variants={item}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
      </motion.div>

      {/* Mobile Dropdown Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, borderBottomWidth: 0 }}
            animate={{ opacity: 1, height: "auto", borderBottomWidth: 1 }}
            exit={{ opacity: 0, height: 0, borderBottomWidth: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-full left-0 w-full bg-background border-border shadow-md border-b flex flex-col md:hidden overflow-hidden origin-top z-40"
          >
            <div className="p-4 flex flex-col gap-3">
              {["Dashboard", "Builder", "Templates"].map((text) => (
                <Link 
                  key={text}
                  href={text === "Builder" ? "/builder/demo" : `/${text.toLowerCase()}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-foreground text-sm font-medium p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50"
                >
                  {text}
                </Link>
              ))}
              
              <SignedOut>
                <div className="h-[1px] w-full bg-border/50 my-2" />
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    Log in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Start for free
                  </Button>
                </SignUpButton>
              </SignedOut>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
