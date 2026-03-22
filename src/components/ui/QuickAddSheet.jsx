import React from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { nativeHaptics } from '@/lib/native';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

/**
 * Bottom sheet for quick transaction type selection.
 */
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
      <DrawerContent className="rounded-t-[28px] border-slate-800 bg-slate-900 px-4 pb-4">
        <div className="flex items-center justify-between px-1 pb-3 pt-2">
          <div className="min-w-[44px]" />
          <h3 className="text-lg font-semibold text-white">Quick add</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors active:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 pb-safe">
          <button
            type="button"
            onClick={() => handleSelect('expense')}
            className="w-full rounded-2xl border-2 border-red-500/30 bg-red-500/10 p-5 text-left transition-all duration-200 active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                <ArrowDownRight className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Add Expense</p>
                <p className="text-sm text-slate-400">Track your spending</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('income')}
            className="w-full rounded-2xl border-2 border-green-500/30 bg-green-500/10 p-5 text-left transition-all duration-200 active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                <ArrowUpRight className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Add Income</p>
                <p className="text-sm text-slate-400">Record your earnings</p>
              </div>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
