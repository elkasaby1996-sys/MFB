import React from 'react';
import { cn } from "@/lib/utils";

export default function NeonCard({ 
  children, 
  className, 
  glowColor = "cyan",
  hover = true,
  onClick
}) {
  const glowColors = {
    cyan: "shadow-[0_0_20px_rgba(0,255,255,0.15)]",
    purple: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    pink: "shadow-[0_0_20px_rgba(236,72,153,0.15)]",
    green: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
    blue: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    teal: "shadow-[0_0_20px_rgba(20,184,166,0.15)]",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50",
        "transition-all duration-300",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}