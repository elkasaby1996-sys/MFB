import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, style, ...props }, ref) => (
  <span className="inline-flex items-center justify-center min-w-[44px] min-h-[44px]">
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "peer relative inline-flex h-[26px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=checked]:bg-[#34C759] data-[state=unchecked]:bg-[#3A3A3C]",
        className
      )}
      style={{
        transition: "background-color 0.2s ease",
        ...style,
      }}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-[24px] w-[24px] rounded-full bg-white",
          "data-[state=checked]:translate-x-[25px] data-[state=unchecked]:translate-x-[1px]"
        )}
        style={{
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.10)",
          transition: "transform 0.2s ease",
        }}
      />
    </SwitchPrimitives.Root>
  </span>
))

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }