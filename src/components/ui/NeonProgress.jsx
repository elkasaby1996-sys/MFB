import React from 'react';
import { cn } from '@/lib/utils';

export default function NeonProgress({
  value = 0,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  color = 'cyan',
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (percentage >= 100) return 'from-emerald-400 to-emerald-500';
    if (percentage >= 70) return 'from-amber-400 to-orange-500';

    const colors = {
      cyan: 'from-cyan-400 to-teal-500',
      purple: 'from-purple-400 to-fuchsia-500',
      pink: 'from-pink-400 to-rose-500',
      green: 'from-emerald-400 to-green-500',
      teal: 'from-teal-400 to-cyan-500',
      blue: 'from-blue-400 to-indigo-500',
      amber: 'from-amber-400 to-orange-500',
      red: 'from-rose-400 to-red-500',
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
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-300 ease-out', getColor())}
          style={{ width: percentage > 0 ? `${Math.max(percentage, 2)}%` : '0%' }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
