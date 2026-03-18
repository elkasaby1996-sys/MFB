import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, AlertTriangle } from "lucide-react";
import { motion } from 'framer-motion';

export default function DailySpendingCircle({ 
  todaySpent, 
  dailyLimit, 
  currency = 'USD',
  onUpdateLimit,
  compact = false
}) {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInput, setLimitInput] = useState(dailyLimit?.toString() || '');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSaveLimit = () => {
    const newLimit = parseFloat(limitInput);
    if (newLimit && newLimit > 0) {
      onUpdateLimit(newLimit);
      setShowLimitModal(false);
    }
  };

  const hasLimit = dailyLimit && dailyLimit > 0;
  const percentage = hasLimit ? (todaySpent / dailyLimit) * 100 : 0;
  
  // Color logic
  let ringColor, glowColor, textColor, statusColor;
  if (percentage >= 100) {
    ringColor = '#ef4444'; // red
    glowColor = 'pink';
    textColor = 'text-red-400';
    statusColor = 'text-red-400';
  } else if (percentage >= 80) {
    ringColor = '#f59e0b'; // orange
    glowColor = 'purple';
    textColor = 'text-orange-400';
    statusColor = 'text-orange-400';
  } else {
    ringColor = '#10b981'; // green
    glowColor = 'green';
    textColor = 'text-green-400';
    statusColor = 'text-green-400';
  }

  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = hasLimit ? circumference - (percentage / 100) * circumference : circumference;

  return (
    <>
      <NeonCard 
        className={`${compact ? 'p-4 cursor-pointer active:scale-95 active:opacity-80 transition-all' : 'p-6'} relative`} 
        glowColor={hasLimit ? glowColor : 'cyan'}
        onClick={compact ? () => setShowLimitModal(true) : undefined}
      >
        {hasLimit ? (
          <div className="relative">
            {compact ? (
              // Compact view for grid
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Daily Limit</p>
                  <div className={`p-1.5 rounded-lg ${percentage >= 100 ? 'bg-red-500/20' : percentage >= 80 ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                    <Settings className={`w-3.5 h-3.5 ${percentage >= 100 ? 'text-red-400' : percentage >= 80 ? 'text-orange-400' : 'text-green-400'}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${textColor}`}>
                  {formatCurrency(todaySpent)}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  of {formatCurrency(dailyLimit)}
                </p>
              </>
            ) : (
              // Full view
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="70"
                    stroke="#1e293b"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="70"
                    stroke={ringColor}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${ringColor})`
                    }}
                  />
                </svg>
                
                {/* Center content */}
                <div 
                  className="absolute flex flex-col items-center justify-center gap-1"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '140px',
                  }}
                >
                  <p className="text-slate-400 text-xs font-medium leading-tight">
                    Today's Spending
                  </p>
                  <p className={`text-xl font-bold leading-tight ${textColor}`}>
                    {formatCurrency(todaySpent)}
                  </p>
                  <p className="text-slate-500 text-xs leading-tight">
                    of {formatCurrency(dailyLimit)} limit
                  </p>
                  {percentage >= 100 && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Over limit!
                    </p>
                  )}
                </div>
              </div>

                {/* Settings button */}
                <button
                  onClick={() => {
                    setLimitInput(dailyLimit?.toString() || '');
                    setShowLimitModal(true);
                  }}
                  className="mt-4 text-cyan-400 text-sm flex items-center gap-2 hover:text-cyan-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Adjust daily limit
                </button>
              </div>
            )}
          </div>
        ) : (
          // No limit set - compact placeholder
          compact ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Daily Limit</p>
                <div className="p-1.5 rounded-lg bg-slate-700/50">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
              <p className="text-white text-xl font-bold">Not Set</p>
              <p className="text-slate-500 text-xs mt-1">Tap to set limit</p>
            </>
          ) : (
            // Full view - no limit
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Settings className="w-12 h-12 text-slate-500" />
              </div>
              <p className="text-white font-semibold mb-2">Set Your Daily Spending Limit</p>
              <p className="text-slate-400 text-sm mb-4">
                Track your daily spending and stay on budget
              </p>
              <NeonButton 
                onClick={() => setShowLimitModal(true)}
                variant="purple"
                size="sm"
              >
                Set Limit
              </NeonButton>
            </div>
          )
        )}
      </NeonCard>

      {/* Set Limit Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Daily Spending Limit</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-slate-400 text-sm">
              Set a daily spending limit to help control your expenses and build better financial habits.
            </p>
            
            <div>
              <Label className="text-slate-300">Daily Limit Amount</Label>
              <Input
                type="number"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                placeholder="e.g. 50"
                className="bg-slate-800 border-slate-700 text-white mt-1 text-lg"
                autoFocus
              />
              <p className="text-slate-500 text-xs mt-1">
                This is the maximum you want to spend each day
              </p>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-cyan-400 text-sm">
                💡 <strong>Tip:</strong> Staying under your daily limit earns you XP and helps you complete missions!
              </p>
            </div>

            <NeonButton 
              onClick={handleSaveLimit}
              disabled={!limitInput || parseFloat(limitInput) <= 0}
              className="w-full"
              variant="purple"
            >
              Save Limit
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}