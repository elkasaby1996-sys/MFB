import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { nativeHaptics } from '@/lib/native';

export default function NeonButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  haptic,
  type = 'button',
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[var(--shadow-button)] hover:brightness-105',
    secondary: 'border border-white/10 bg-white/[0.04] text-slate-100 shadow-[var(--shadow-soft)] hover:bg-white/[0.07]',
    purple: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[var(--shadow-soft)] hover:brightness-105',
    ghost: 'bg-transparent text-cyan-300 hover:bg-cyan-500/10',
    danger: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[var(--shadow-soft)] hover:brightness-105',
  };

  const sizes = {
    sm: 'min-h-[44px] px-4 py-2 text-sm',
    md: 'min-h-[48px] px-5 py-3 text-[15px]',
    lg: 'min-h-[52px] px-6 py-4 text-base',
    icon: 'min-h-[44px] min-w-[44px] p-3',
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
        'inline-flex items-center justify-center gap-2 rounded-[18px] font-semibold tracking-[0.01em] transition-all duration-200',
        'active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}
