import React from 'react';
import { cn } from "@/lib/utils";

export default function NeonProgress({ 
  value = 0, 
  max = 100, 
  className,
  showLabel = false,
  size = "md",
  color = "cyan"
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (percentage >= 100) return "from-green-500 to-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
    if (percentage >= 70) return "from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
    
    const colors = {
      cyan: "from-cyan-500 to-teal-500 shadow-[0_0_10px_rgba(0,255,255,0.5)]",
      purple: "from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
      pink: "from-pink-500 to-rose-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]",
      green: "from-green-500 to-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
      teal: "from-teal-500 to-cyan-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]",
      blue: "from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
      amber: "from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
      red: "from-red-500 to-pink-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    };
    return colors[color] || colors.cyan;
  };

  const sizes = {
    xs: "h-1.5",
    sm: "h-2",
    md: "h-2.5",
    lg: "h-4"
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full overflow-hidden rounded-full bg-white/8 ring-1 ring-white/6", sizes[size])}>
        <div
          className={cn(
            "h-full bg-gradient-to-r rounded-full transition-all duration-500",
            getColor()
          )}
          style={{ width: percentage > 0 ? `${Math.max(percentage, 2)}%` : '0%' }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}