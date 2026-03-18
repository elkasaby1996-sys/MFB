import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import NeonButton from './NeonButton';

export default function StreakModal({ isOpen, onClose, streakDays }) {
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose} />

          
          <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">

            <div className="w-[85%] max-w-xs pointer-events-auto"
          onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">Your Streak 🔥</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 rounded-xl text-slate-400 active:bg-slate-800 transition-colors"
                  style={{ minWidth: 40, minHeight: 40 }}>

                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🔥</div>
                <p className="text-3xl font-bold text-orange-400 mb-2">{streakDays} days</p>
                <p className="text-slate-400 text-xs">Log activity daily to maintain your streak

                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-3 mt-3">
                <p className="text-slate-300 text-xs mb-1.5">💡 Tips to keep your streak:</p>
                <ul className="text-slate-400 text-[11px] space-y-0.5">
                  <li>• Log at least one transaction each day</li>
                  <li>• Check your dashboard daily</li>

                </ul>
              </div>

              <NeonButton onClick={onClose} className="w-full mt-3" size="sm">
                Got it!
              </NeonButton>
            </div>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}