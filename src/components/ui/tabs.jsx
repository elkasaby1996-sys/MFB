import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Premium pill container — dark, subtle inner padding, soft rounded
      "inline-flex w-full items-center justify-center",
      "bg-slate-800/60 backdrop-blur-sm",
      "rounded-2xl p-1 gap-0.5",
      "border border-slate-700/40",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base — flex, centered, full height, min touch target
      "relative flex-1 inline-flex items-center justify-center gap-1.5",
      "min-h-[44px] px-2 py-2",
      "rounded-xl",
      "text-xs font-medium tracking-wide",
      "whitespace-nowrap select-none",
      // Inactive state
      "text-slate-400",
      "transition-all duration-200 ease-out",
      // Active state — clean cyan pill chip
      "data-[state=active]:bg-slate-700/80",
      "data-[state=active]:text-cyan-300",
      "data-[state=active]:shadow-sm",
      "data-[state=active]:shadow-black/20",
      // Disabled
      "disabled:pointer-events-none disabled:opacity-40",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-0",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }