import React from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { nativeHaptics } from '@/lib/native';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

/**
 * Bottom sheet for quick transaction type selection
 */
export default function QuickAddSheet({ isOpen, onClose, onSelectType }) {
  const handleSelect = (type) => {
    nativeHaptics.selection();
    onSelectType(type);
    onClose();
  };

  const handleClose = () => {
    nativeHaptics.tap();
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="bg-slate-900 border-slate-800 text-white">
        <div className="px-6 pb-6">
          <div className="mb-6 flex items-center justify-between pt-2">
            <h3 className="text-white text-xl font-semibold">Add Transaction</h3>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-400 active:bg-slate-800 transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSelect('expense')}
              className="w-full p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              style={{ minHeight: 56 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">Add Expense</p>
                  <p className="text-slate-400 text-sm">Track your spending</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelect('income')}
              className="w-full p-5 rounded-2xl bg-green-500/10 border-2 border-green-500/30 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              style={{ minHeight: 56 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">Add Income</p>
                  <p className="text-slate-400 text-sm">Record your earnings</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
