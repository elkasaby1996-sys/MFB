import React, { useState, useEffect } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from '@/components/ui/input';
import { Target, Pencil, Check, X } from 'lucide-react';

const STORAGE_KEY = 'networth_goal';

export default function NetWorthGoal({ currentNetWorth, currency = 'USD' }) {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseFloat(saved) : null;
  });
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const startEdit = () => {
    setInputValue(goal ? goal.toString() : '');
    setEditing(true);
  };

  const save = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      localStorage.setItem(STORAGE_KEY, val.toString());
    }
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const progress = goal ? Math.min(100, Math.max(0, (currentNetWorth / goal) * 100)) : 0;
  const remaining = goal ? goal - currentNetWorth : 0;
  const achieved = goal && currentNetWorth >= goal;

  return (
    <NeonCard className="p-5" glowColor="cyan">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Net Worth Goal</h3>
        </div>
        {goal && !editing && (
          <button
            onClick={startEdit}
            className="text-slate-400 active:text-cyan-400 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {!goal && !editing ? (
        <div className="text-center py-4 space-y-3">
          <p className="text-slate-400 text-sm">Set a net worth goal to track your progress</p>
          <NeonButton onClick={startEdit} variant="secondary" size="sm">
            Set Goal
          </NeonButton>
        </div>
      ) : editing ? (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Enter your target net worth</p>
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 100000"
            className="bg-slate-800 border-slate-700 text-white h-12"
            autoFocus
          />
          <div className="flex gap-2">
            <NeonButton onClick={save} className="flex-1" size="sm">
              <Check className="w-4 h-4" /> Save
            </NeonButton>
            <NeonButton onClick={cancel} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </NeonButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {achieved ? (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center">
              <p className="text-cyan-400 font-semibold text-lg">🎉 Goal Achieved!</p>
              <p className="text-slate-300 text-sm mt-1">You reached your net worth goal!</p>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs mb-1">Current</p>
              <p className="text-white font-bold text-lg">{formatMoney(currentNetWorth, currency, { decimals: 0 })}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs mb-1">Goal</p>
              <p className="text-cyan-400 font-bold text-lg">{formatMoney(goal, currency, { decimals: 0 })}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{progress.toFixed(0)}% there</span>
              {!achieved && <span>{formatMoney(remaining, currency, { decimals: 0 })} to go</span>}
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: achieved
                    ? 'linear-gradient(to right, #06b6d4, #14b8a6)'
                    : 'linear-gradient(to right, #6366f1, #06b6d4)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </NeonCard>
  );
}