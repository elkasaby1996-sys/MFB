import React from 'react';
import { cn } from '@/lib/utils';

export default function NeonCard({ children, className, glowColor = 'cyan', hover = true, onClick }) {
  const glowColors = {
    cyan: 'shadow-[0_12px_30px_rgba(6,182,212,0.08)]',
    purple: 'shadow-[0_12px_30px_rgba(168,85,247,0.08)]',
    pink: 'shadow-[0_12px_30px_rgba(236,72,153,0.08)]',
    green: 'shadow-[0_12px_30px_rgba(34,197,94,0.08)]',
    blue: 'shadow-[0_12px_30px_rgba(59,130,246,0.08)]',
    teal: 'shadow-[0_12px_30px_rgba(20,184,166,0.08)]',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[28px] border border-white/10 bg-slate-900/82 backdrop-blur-xl shadow-[var(--shadow-card)]",
        "transition-all duration-300",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
