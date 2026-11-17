"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";

export interface HeroScriptedEditState {
  // Current loop time in ms (0 to 12000)
  loopTime: number;
  // Currently typed extra string for line 6: e.g. ', "live": true'
  typedText: string;
  // Whether the typewriter cursor is active
  showCursor: boolean;
  // Whether line 6 has soft background highlight
  isLineHighlighted: boolean;
  // "Invoice Gen" status: Idle -> Running
  invoiceStatus: "Idle" | "Running";
  // Active Workflows counter: 1,244 -> 1,251
  metricValue: number;
  // Third table row ("Slack Alerts")
  isSlackAlertsVisible: boolean;
  // Hover and pause state
  isPaused: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  containerRef: (node: HTMLElement | null) => void;
}

const FULL_TYPED_TEXT = ', "live": true';
const LOOP_DURATION = 12000; // 12 seconds per loop

const HeroScriptedEditContext = createContext<HeroScriptedEditState | null>(null);

export function HeroScriptedEditProvider({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, return static final state
  const [loopTime, setLoopTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);

  const containerElementRef = useRef<HTMLElement | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const loopTimeRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isIntersectingRef = useRef(true);

  isHoveredRef.current = isHovered;
  isIntersectingRef.current = isIntersecting;

  // IntersectionObserver callback ref
  const containerRef = useCallback((node: HTMLElement | null) => {
    containerElementRef.current = node;
  }, []);

  useEffect(() => {
    const el = containerElementRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animation loop clock
  useEffect(() => {
    if (shouldReduceMotion) return;

    let animId: number;

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      // Only advance time if in-view and not hovered
      if (!isHoveredRef.current && isIntersectingRef.current) {
        loopTimeRef.current = (loopTimeRef.current + delta) % LOOP_DURATION;
        setLoopTime(loopTimeRef.current);
      }

      animId = requestAnimationFrame(tick);
    };

    if (typeof window !== "undefined") {
      (window as unknown as { __heroController?: unknown }).__heroController = {
        reset: () => {
          loopTimeRef.current = 0;
          setLoopTime(0);
        },
        setTime: (t: number) => {
          loopTimeRef.current = t;
          setLoopTime(t);
        },
        getTime: () => loopTimeRef.current,
      };
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shouldReduceMotion]);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  if (shouldReduceMotion) {
    // Static final state for prefers-reduced-motion
    const staticValue: HeroScriptedEditState = {
      loopTime: 6000,
      typedText: FULL_TYPED_TEXT,
      showCursor: false,
      isLineHighlighted: true,
      invoiceStatus: "Running",
      metricValue: 1251,
      isSlackAlertsVisible: true,
      isPaused: false,
      onMouseEnter,
      onMouseLeave,
      containerRef,
    };
    return (
      <HeroScriptedEditContext.Provider value={staticValue}>
        {children}
      </HeroScriptedEditContext.Provider>
    );
  }

  // Calculate reactive state from loopTime (0 to 12000 ms)
  // Timeline:
  // 0ms - 1800ms: Initial clean state
  // 1800ms - 3600ms: Types ', "live": true', line gets soft highlight
  // 3600ms - 4800ms: Synchronous reactive update:
  //   a) Invoice Gen status crossfades Idle -> Running
  //   b) Metric counts up 1,244 -> 1,251 (3700ms - 4500ms)
  //   c) Slack Alerts row slides into table
  // 4800ms - 10200ms: Hold live state (~5.4s)
  // 10200ms - 11800ms: Smooth reset / fade back
  // 11800ms - 12000ms: Clean pause before next loop

  const t = loopTime;

  // 1. Line highlight: active from typing start (1800ms) through hold (10400ms)
  const isLineHighlighted = t >= 1800 && t < 10400;

  // 2. Typed text & cursor:
  let typedText = "";
  let showCursor = false;

  if (t < 1800) {
    typedText = "";
    showCursor = false;
  } else if (t >= 1800 && t < 3400) {
    // Typewriter effect over 1600ms
    const typeProgress = (t - 1800) / 1600;
    const charCount = Math.floor(typeProgress * FULL_TYPED_TEXT.length);
    typedText = FULL_TYPED_TEXT.slice(0, charCount);
    showCursor = true;
  } else if (t >= 3400 && t < 10400) {
    // Fully typed hold
    typedText = FULL_TYPED_TEXT;
    showCursor = t < 4000 && Math.floor(t / 250) % 2 === 0; // Gentle blinks right after typing
  } else if (t >= 10400 && t < 11400) {
    // Fade/clear on reset
    typedText = "";
    showCursor = false;
  }

  // 3. Invoice Gen status: Idle -> Running at 3700ms, resets at 10500ms
  const invoiceStatus: "Idle" | "Running" = t >= 3700 && t < 10500 ? "Running" : "Idle";

  // 4. Metric value: counts up 1,244 -> 1,251 between 3700ms and 4500ms, resets at 10500ms
  let metricValue = 1244;
  if (t < 3700) {
    metricValue = 1244;
  } else if (t >= 3700 && t < 4500) {
    const p = (t - 3700) / 800;
    // Smooth easeOutQuad interpolation
    const ease = 1 - (1 - p) * (1 - p);
    metricValue = Math.min(1251, Math.round(1244 + ease * 7));
  } else if (t >= 4500 && t < 10500) {
    metricValue = 1251;
  } else if (t >= 10500 && t < 11200) {
    const p = (t - 10500) / 700;
    const ease = 1 - (1 - p) * (1 - p);
    metricValue = Math.max(1244, Math.round(1251 - ease * 7));
  } else {
    metricValue = 1244;
  }

  // 5. Slack Alerts table row: slides in at 3800ms, exits at 10400ms
  const isSlackAlertsVisible = t >= 3800 && t < 10400;

  const value: HeroScriptedEditState = {
    loopTime,
    typedText,
    showCursor,
    isLineHighlighted,
    invoiceStatus,
    metricValue,
    isSlackAlertsVisible,
    isPaused: isHovered || !isIntersecting,
    onMouseEnter,
    onMouseLeave,
    containerRef,
  };

  return (
    <HeroScriptedEditContext.Provider value={value}>
      {children}
    </HeroScriptedEditContext.Provider>
  );
}

const DEFAULT_STATE: HeroScriptedEditState = {
  loopTime: 0,
  typedText: "",
  showCursor: false,
  isLineHighlighted: false,
  invoiceStatus: "Idle",
  metricValue: 1244,
  isSlackAlertsVisible: false,
  isPaused: false,
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  containerRef: () => {},
};

export function useHeroScriptedEdit(): HeroScriptedEditState {
  const context = useContext(HeroScriptedEditContext);
  return context || DEFAULT_STATE;
}
