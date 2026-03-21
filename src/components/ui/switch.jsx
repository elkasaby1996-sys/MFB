import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, style, ...props }, ref) => (
  <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center">
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "peer relative inline-flex h-[32px] w-[52px] shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-[#2c2c2e] p-[2px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),inset_0_-1px_1px_rgba(15,23,42,0.16)] backdrop-blur-sm",
        "transition-[background-color,box-shadow,border-color] duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=checked]:border-[#30d158]/60 data-[state=checked]:bg-[#34c759] data-[state=checked]:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_10px_24px_rgba(52,199,89,0.22)]",
        className
      )}
      style={{
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-[28px] w-[28px] rounded-full bg-[linear-gradient(180deg,#ffffff_0%,#f4f4f5_100%)] shadow-[0_1px_1px_rgba(255,255,255,0.8)_inset,0_3px_8px_rgba(15,23,42,0.28)]",
          "transition-transform duration-200 ease-out will-change-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  </span>
))

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
