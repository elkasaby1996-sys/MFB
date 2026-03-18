import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  // Auto-select appropriate inputMode for numeric inputs
  const inputMode = type === 'number' ? 'decimal' : undefined;
  
  return (
    (<input
      type={type}
      inputMode={inputMode}
      className={cn(
        "flex h-12 w-full rounded-xl border border-input bg-transparent px-4 py-3 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }