import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { nativeHaptics } from '@/lib/native';

export default function NeonButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  haptic,
  type = "button"
}) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] active:brightness-90 active:shadow-[0_0_15px_rgba(0,255,255,0.2)]",
    secondary: "bg-slate-800 text-cyan-400 border border-cyan-500/30 active:bg-slate-700 active:border-cyan-400/40",
    purple: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] active:brightness-90 active:shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    ghost: "bg-transparent text-cyan-400 active:bg-cyan-500/10 active:opacity-70",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] active:brightness-90 active:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[44px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[52px]",
    icon: "p-3 min-h-[44px] min-w-[44px]"
  };

  const handleClick = (e) => {
    if (!disabled && !loading && haptic && nativeHaptics[haptic]) {
      nativeHaptics[haptic]();
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "rounded-xl font-semibold transition-all duration-200 transform cursor-pointer",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        "flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}
