import React, { useState } from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * iOS-style date picker — tap trigger → bottom sheet slides up with a graphical calendar.
 * 
 * Props:
 *  value        — string in "yyyy-MM-dd" format
 *  onChange     — (dateString: string) => void
 *  label        — optional label text
 *  placeholder  — fallback text when no date selected
 *  className    — extra classes on the trigger button
 *  disabled     — disables the trigger
 */
export default function MobileDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const parsedDate = value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "ui-input w-full flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-[var(--field-surface)] px-[var(--space-4)] py-[calc(var(--space-3)+1px)] text-base shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,background-color,transform] duration-200",
          "min-h-[var(--control-height-md)]",
          "active:scale-[0.99]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <CalendarDays className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <span className={cn("truncate", parsedDate ? "text-white" : "text-slate-500")}>
            {parsedDate ? format(parsedDate, 'MMMM d, yyyy') : placeholder}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {/* Bottom Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="rounded-t-3xl border-t border-slate-700 bg-slate-900 p-0 keyboard-sheet"
          style={{ maxHeight: '90dvh' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 text-sm active:text-white transition-colors min-h-[44px] px-2"
            >
              Cancel
            </button>
            <span className="text-white font-semibold text-base">Choose date</span>
            <button
              onClick={() => setOpen(false)}
              className="text-cyan-400 text-sm font-semibold active:text-cyan-300 transition-colors min-h-[44px] px-2"
            >
              Done
            </button>
          </div>

          {/* Calendar */}
          <div className="flex justify-center px-4 py-4 overflow-y-auto">
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={handleSelect}
              defaultMonth={parsedDate}
              className="text-white"
              classNames={{
                months: "flex flex-col",
                month: "space-y-4",
                caption: "flex justify-center relative items-center",
                caption_label: "text-white font-semibold text-base",
                nav: "space-x-1 flex items-center",
                nav_button: "h-9 w-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 active:scale-95 transition-all",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-slate-500 rounded-md w-10 font-normal text-sm flex-1 text-center",
                row: "flex w-full mt-2",
                cell: "flex-1 text-center text-sm relative focus-within:relative focus-within:z-20",
                day: "h-10 w-10 mx-auto p-0 font-normal rounded-full text-white hover:bg-slate-700 transition-colors active:scale-95 flex items-center justify-center",
                day_selected: "bg-cyan-500 text-white hover:bg-cyan-400 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.5)]",
                day_today: "border border-cyan-500/50 text-cyan-400 font-semibold",
                day_outside: "text-slate-600",
                day_disabled: "text-slate-700",
              }}
            />
          </div>

          {/* Safe area spacer */}
          <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} />
        </SheetContent>
      </Sheet>
    </>
  );
}