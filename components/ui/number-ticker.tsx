"use client"

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const motionValue = useMotionValue(
    shouldReduceMotion ? value : direction === "down" ? value : startValue
  )
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 120,
  })
  const isInView = useInView(ref, { once: false, margin: "0px" })

  const formatNum = (n: number) =>
    Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Number(n.toFixed(decimalPlaces)))

  useEffect(() => {
    if (shouldReduceMotion) {
      if (ref.current) {
        ref.current.textContent = formatNum(value)
      }
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [motionValue, isInView, delay, value, direction, startValue, shouldReduceMotion, decimalPlaces])

  useEffect(() => {
    if (shouldReduceMotion) return
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatNum(latest)
      }
    })
  }, [springValue, decimalPlaces, shouldReduceMotion])

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-tight text-foreground tabular-nums",
        className
      )}
      {...props}
    >
      {formatNum(shouldReduceMotion ? value : startValue)}
    </span>
  )
}
