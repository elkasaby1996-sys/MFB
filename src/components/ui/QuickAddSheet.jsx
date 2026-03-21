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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-3xl shadow-2xl safe-bottom safe-x"
            style={{
              paddingBottom: 'var(--safe-bottom)'
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
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
