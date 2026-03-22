import React, { useState, useMemo } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nativeHaptics } from '@/lib/native';

export default function MobileSelect({
  value,
  onValueChange,
  options = [],
  placeholder = 'Select...',
  title,
  triggerClassName = '',
  error = false,
  disabled = false,
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q));
  }, [options, search, searchable]);

  const handleSelect = (optionValue) => {
    nativeHaptics.selection();
    onValueChange(optionValue);
    setOpen(false);
    setSearch('');
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen && open) nativeHaptics.tap();
    setOpen(isOpen);
    if (!isOpen) setSearch('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          nativeHaptics.tap();
          setOpen(true);
        }}
        disabled={disabled}
        className={cn(
          'ui-input flex w-full items-center justify-between gap-3 rounded-[18px] px-4 text-left',
          error && 'border-red-500',
          disabled && 'cursor-not-allowed opacity-50',
          triggerClassName,
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2.5', !selectedOption && 'text-slate-500')}>
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="flex-shrink-0 text-xl">{selectedOption.icon}</span>}
              <span className="truncate font-medium text-white">{selectedOption.label}</span>
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex max-h-[85dvh] flex-col rounded-t-[28px] border-slate-800 bg-slate-950" style={{ paddingBottom: 0 }}>
          <div className="flex items-center justify-between px-5 pb-3 pt-2.5">
            <div className="min-w-[44px]" />
            {title ? <h3 className="text-base font-semibold text-white">{title}</h3> : <div />}
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              aria-label="Close"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 active:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {searchable && (
            <div className="px-4 pb-3">
              <div className="ui-input flex h-11 items-center gap-3 rounded-2xl px-3.5">
                <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-500" />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 24px)' }}>
            {filteredOptions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No results found</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'mb-1 flex min-h-[54px] w-full items-center justify-between rounded-2xl px-4 py-3 transition-all active:scale-[0.985]',
                    value === option.value ? 'bg-white/[0.06] ring-1 ring-white/10' : 'active:bg-slate-800/80',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {option.icon && <span className="w-7 flex-shrink-0 text-center text-xl">{option.icon}</span>}
                    <span className="min-w-0 text-left">
                      <span className={cn('block truncate text-[15px] font-medium', value === option.value ? 'text-white' : 'text-slate-100')}>
                        {option.label}
                      </span>
                      {option.description ? <span className="mt-0.5 block truncate text-xs text-slate-500">{option.description}</span> : null}
                    </span>
                  </span>
                  {value === option.value ? <Check className="ml-2 h-4.5 w-4.5 flex-shrink-0 text-cyan-300" /> : null}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
