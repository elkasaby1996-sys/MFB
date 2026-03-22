import React from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { nativeHaptics } from '@/lib/native';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

export default function QuickAddSheet({ isOpen, onClose, onSelectType }) {
  const handleSelect = (type) => {
    nativeHaptics.selection();
    onSelectType(type);
    onClose();
  };

  const handleOpenChange = (open) => {
    if (!open) {
      nativeHaptics.tap();
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="rounded-t-[28px] border-slate-800 bg-slate-950 px-4 pb-4">
        <div className="flex items-center justify-between px-1 pb-3 pt-2">
          <div className="min-w-[44px]" />
          <div className="text-center">
            <h3 className="text-base font-semibold text-white">Quick add</h3>
            <p className="mt-0.5 text-xs text-slate-500">Choose what you want to record</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 active:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2.5 pb-safe">
          <button
            type="button"
            onClick={() => handleSelect('expense')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left transition-all active:scale-[0.985]"
            style={{ minHeight: 54 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/12">
                <ArrowDownRight className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">Expense</p>
                <p className="text-xs text-slate-500">Track money going out</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('income')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left transition-all active:scale-[0.985]"
            style={{ minHeight: 54 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/12">
                <ArrowUpRight className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">Income</p>
                <p className="text-xs text-slate-500">Record money coming in</p>
              </div>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
