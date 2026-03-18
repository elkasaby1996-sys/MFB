import React from 'react';
import { cn } from "@/lib/utils";
import NeonCard from './NeonCard';

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  trendLabel,
  color = "cyan",
  className 
}) {
  const iconColors = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    pink: "text-pink-400 bg-pink-500/10",
    green: "text-green-400 bg-green-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    teal: "text-teal-400 bg-teal-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    red: "text-red-400 bg-red-500/10",
  };

  const valueColors = {
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    green: "text-green-400",
    blue: "text-blue-400",
    teal: "text-teal-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <NeonCard glowColor={color} className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className={cn("text-base font-bold break-all leading-tight", valueColors[color])}>{value}</p>
          {trend !== undefined && !isNaN(trend) && isFinite(trend) && (
            <div className="flex flex-col gap-0.5 mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(2)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 sm:p-3 rounded-xl flex-shrink-0", iconColors[color])}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
    </NeonCard>
  );
}