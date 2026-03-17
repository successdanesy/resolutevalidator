import * as React from "react"

import { cn } from "@/lib/utils"

interface GradientSlideButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  colorFrom?: string
  colorTo?: string
  bgColor?: string
}

export function GradientSlideButton({
  children,
  className,
  colorFrom = "#ffffff",
  colorTo = "#e2e8f0",
  bgColor,
  ...props
}: GradientSlideButtonProps) {
  return (
    <button
      style={
        {
          "--color-from": colorFrom,
          "--color-to": colorTo,
          ...(bgColor ? { backgroundColor: bgColor } : {}),
        } as React.CSSProperties
      }
      className={cn(
        "relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-[105%]",
        !bgColor && "bg-neutral-50 text-black dark:bg-neutral-800 dark:text-white",
        "before:absolute before:top-0 before:left-[-100%] before:h-full before:w-full before:rounded-[inherit] before:bg-gradient-to-l before:from-[var(--color-from)] before:to-[var(--color-to)] before:transition-all before:duration-200",
        "hover:before:left-0",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-[inherit]">{children}</span>
    </button>
  )
}
