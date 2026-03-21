import React, { useState, useMemo } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nativeHaptics } from '@/lib/native';

/**
 * MobileSelect – a bottom-sheet picker optimised for iOS / Android.
 *
 * Props:
 *   value          – current selected value (string)
 *   onValueChange  – callback(value: string)
 *   options        – [{ value, label, icon?, description? }]
 *   placeholder    – text shown when nothing is selected
 *   title          – sheet header text
 *   triggerClassName – extra classes for the trigger button
 *   error          – boolean, adds red border to trigger
 *   disabled       – boolean
 *   searchable     – boolean, shows search input (good for long lists)
 */
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

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.description || '').toLowerCase().includes(q)
    );
  }, [options, search, searchable]);

  const handleSelect = (optionValue) => {
    nativeHaptics.selection();
    onValueChange(optionValue);
    setOpen(false);
    setSearch('');
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen && open) {
      nativeHaptics.tap();
    }
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
          'flex items-center justify-between w-full px-4 h-14 rounded-lg border bg-slate-800 border-slate-700 text-white transition-all active:opacity-70 active:scale-[0.99]',
          error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed',
          triggerClassName
        )}
      >
        <span className={cn('flex items-center gap-2 min-w-0', !selectedOption && 'text-slate-500')}>
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="text-xl flex-shrink-0">{selectedOption.icon}</span>}
              <span className="truncate font-medium">{selectedOption.label}</span>
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent
          className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col"
          style={{ paddingBottom: 0, maxHeight: '85dvh' }}
        >
          <div className="flex items-center justify-between px-5 pb-3 pt-2 flex-shrink-0">
            <div className="min-w-[44px]" />
            {title ? (
              <h3 className="text-white text-lg font-semibold text-center">{title}</h3>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              aria-label="Close"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 active:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          {searchable && (
            <div className="px-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 h-12 border border-slate-700">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent text-white flex-1 outline-none text-base placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          {/* Options — scrollable, with home-indicator safe area at bottom */}
          <div
            className="flex-1 overflow-y-auto px-3"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 24px)' }}
          >
            {filteredOptions.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No results found</p>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3.5 rounded-2xl mb-1 transition-all active:scale-[0.98] min-h-[58px]',
                    value === option.value
                      ? 'bg-cyan-500/15 border border-cyan-500/30'
                      : 'active:bg-slate-800/80'
                  )}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {option.icon && (
                      <span className="text-2xl flex-shrink-0 w-8 text-center">{option.icon}</span>
                    )}
                    <span className="text-left min-w-0">
                      <span className={cn(
                        'block text-base font-medium truncate',
                        value === option.value ? 'text-cyan-300' : 'text-white'
                      )}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block text-xs text-slate-400 truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </span>
                  {value === option.value && (
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
