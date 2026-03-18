import React from 'react';
import { cn } from "@/lib/utils";

export const AVATARS = [
  { id: "green-suit", color: "green", style: "suit", gradient: "from-green-400 to-emerald-500" },
  { id: "blue-suit", color: "blue", style: "suit", gradient: "from-blue-400 to-cyan-500" },
  { id: "purple-suit", color: "purple", style: "suit", gradient: "from-purple-400 to-pink-500" },
  { id: "pink-tech", color: "pink", style: "tech", gradient: "from-pink-400 to-rose-500" },
  { id: "teal-tech", color: "teal", style: "tech", gradient: "from-teal-400 to-cyan-500" },
  { id: "red-blazer", color: "red", style: "blazer", gradient: "from-red-400 to-orange-500" },
  { id: "silver-exec", color: "silver", style: "exec", gradient: "from-slate-300 to-slate-500" },
  { id: "gold-pro", color: "gold", style: "pro", gradient: "from-amber-400 to-yellow-500" },
];

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

export default function AlienAvatar({ 
  avatarId = "green-suit", 
  size = "md",
  showGlow = true,
  selected = false,
  onClick,
  className 
}) {
  const avatar = getAvatarById(avatarId);
  
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const glowSizes = {
    sm: "shadow-[0_0_15px_rgba(0,255,255,0.3)]",
    md: "shadow-[0_0_25px_rgba(0,255,255,0.4)]",
    lg: "shadow-[0_0_35px_rgba(0,255,255,0.5)]",
    xl: "shadow-[0_0_45px_rgba(0,255,255,0.6)]",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-full bg-gradient-to-br",
        avatar.gradient,
        sizes[size],
        showGlow && glowSizes[size],
        selected && "ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-900",
        onClick && "cursor-pointer hover:scale-105 transition-transform",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "font-bold text-white/90",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-4xl",
          size === "xl" && "text-5xl",
        )}>
          👽
        </span>
      </div>
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-xl -z-10",
        avatar.gradient
      )} />
    </div>
  );
}