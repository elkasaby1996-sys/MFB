import React from 'react';
import { cn } from "@/lib/utils";
import { Zap, Trophy, Star, Rocket } from "lucide-react";

export function getLevelInfo(level) {
  if (level >= 20) return { title: "Alien CFO", icon: Rocket, color: "purple" };
  if (level >= 10) return { title: "Money Bro", icon: Trophy, color: "cyan" };
  if (level >= 5) return { title: "Apprentice Bro", icon: Star, color: "teal" };
  return { title: "Rookie Bro", icon: Zap, color: "green" };
}

export function getXPForLevel(level) {
  return level * 100;
}

export default function XPBadge({ 
  xp = 0, 
  level = 1,
  showProgress = true,
  size = "md",
  className 
}) {
  const levelInfo = getLevelInfo(level);
  const Icon = levelInfo.icon;
  const currentLevelXP = getXPForLevel(level);
  const progress = ((xp % 100) / 100) * 100;

  const sizes = {
    sm: {
      container: "px-3 py-1.5",
      icon: "w-4 h-4",
      text: "text-xs",
    },
    md: {
      container: "px-4 py-2",
      icon: "w-5 h-5",
      text: "text-sm",
    },
    lg: {
      container: "px-6 py-3",
      icon: "w-6 h-6",
      text: "text-base",
    },
  };

  const colors = {
    green: "from-green-500 to-emerald-500 text-green-400",
    teal: "from-teal-500 to-cyan-500 text-teal-400",
    cyan: "from-cyan-500 to-blue-500 text-cyan-400",
    purple: "from-purple-500 to-pink-500 text-purple-400",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700",
        sizes[size].container
      )}>
        <div className={cn(
          "bg-gradient-to-r rounded-lg p-1.5",
          colors[levelInfo.color].split(" ").slice(0, 2).join(" ")
        )}>
          <Icon className={cn("text-white", sizes[size].icon)} />
        </div>
        <div>
          <p className={cn("font-bold text-white", sizes[size].text)}>
            Level {level}
          </p>
          <p className={cn("text-slate-400", sizes[size].text, "text-xs")}>
            {levelInfo.title}
          </p>
        </div>
      </div>
      
      {showProgress && (
        <div className="flex-1 max-w-32">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{xp % 100} XP</span>
            <span>100 XP</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-gradient-to-r rounded-full transition-all duration-500",
                colors[levelInfo.color].split(" ").slice(0, 2).join(" ")
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}