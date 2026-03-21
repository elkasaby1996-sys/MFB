import React from 'react';
import { cn } from "@/lib/utils";
import NeonButton from '@/components/ui/NeonButton';

/**
 * Sticky footer for forms with primary/secondary actions
 * Respects safe-area bottom inset and prevents keyboard overlap
 */
export default function StickyFormFooter({ 
  onCancel,
  onSubmit,
  cancelText = "Cancel",
  submitText = "Save",
  submitDisabled = false,
  submitLoading = false,
  submitVariant = "primary",
  className
}) {
  return (
    <div className={cn(
      "sticky bottom-0 left-0 right-0 z-10",
      "bg-slate-900/95 backdrop-blur-xl border-t border-slate-800",
      "p-4 pb-safe safe-x",
      className
    )}>
      <div className="flex gap-3 max-w-lg mx-auto">
        {onCancel && (
          <NeonButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1 min-h-[48px]"
          >
            {cancelText}
          </NeonButton>
        )}
        <NeonButton
          type="submit"
          onClick={onSubmit}
          variant={submitVariant}
          disabled={submitDisabled}
          loading={submitLoading}
          className="flex-1 min-h-[48px]"
        >
          {submitText}
        </NeonButton>
      </div>
    </div>
  );
}
