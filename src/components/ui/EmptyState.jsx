import React from 'react';
import NeonButton from './NeonButton';
import { cn } from "@/lib/utils";

/**
 * Reusable empty state component
 */
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}) {
  return (
    <div className={cn("text-center py-12 px-6", className)}>
      {Icon && (
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      )}
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <NeonButton onClick={onAction} variant="primary">
          {actionLabel}
        </NeonButton>
      )}
    </div>
  );
}