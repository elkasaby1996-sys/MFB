import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * iOS-style bottom sheet picker
 * Props:
 *   value, onValueChange, options: [{ value, label, icon? }]
 *   title, placeholder, triggerClassName
 */
export default function IOSPicker({ value, onValueChange, options = [], title, placeholder = 'Select...', triggerClassName }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center justify-center w-full h-12 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm gap-1',
          triggerClassName
        )}
      >
        {selected?.icon && <span className="text-base flex-shrink-0">{selected.icon}</span>}
        <span className={cn('truncate', !selected && 'text-slate-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="bg-slate-950 border-t border-slate-800 rounded-t-2xl px-0 pb-safe max-h-[80vh] flex flex-col"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          {title && (
            <div className="px-6 py-3 flex-shrink-0">
              <h3 className="text-white text-lg font-semibold">{title}</h3>
            </div>
          )}

          <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-4 rounded-xl text-left transition-colors',
                    isSelected
                      ? 'bg-teal-900/40 border border-teal-500/40'
                      : 'bg-transparent active:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-4">
                    {opt.icon && <span className="text-2xl w-8 text-center">{opt.icon}</span>}
                    <span className={cn('text-base font-medium', isSelected ? 'text-cyan-400' : 'text-white')}>
                      {opt.label}
                    </span>
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}