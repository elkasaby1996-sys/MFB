import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import { Trophy, Check } from "lucide-react";
import { format } from 'date-fns';

const MILESTONES = [
  { threshold: 0, name: 'First Positive Net Worth', icon: '🎯', xp: 100 },
  { threshold: 1000, name: 'First $1,000', icon: '💰', xp: 150 },
  { threshold: 5000, name: '$5,000 Net Worth', icon: '🚀', xp: 300 },
  { threshold: 10000, name: '$10,000 Net Worth', icon: '⭐', xp: 500 },
  { threshold: 25000, name: '$25,000 Net Worth', icon: '💎', xp: 750 },
  { threshold: 50000, name: '$50,000 Net Worth', icon: '👑', xp: 1000 },
  { threshold: 100000, name: '$100,000 Net Worth', icon: '🏆', xp: 2000 },
];

export default function MilestonesWidget({ currentNetWorth, history, currency = 'USD' }) {
  // Determine achieved milestones
  const achievedMilestones = MILESTONES.filter(m => currentNetWorth >= m.threshold);
  const nextMilestone = MILESTONES.find(m => currentNetWorth < m.threshold);

  return (
    <NeonCard className="p-5" glowColor="teal">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-teal-400" />
        <h3 className="text-white font-semibold">Milestones</h3>
      </div>

      {/* Achieved Milestones */}
      <div className="space-y-2 mb-4">
        {achievedMilestones.length > 0 ? (
          achievedMilestones.reverse().slice(0, 3).map((milestone, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between bg-teal-500/10 border border-teal-500/30 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-xl">
                  {milestone.icon}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{milestone.name}</p>

                </div>
              </div>
              <Check className="w-5 h-5 text-teal-400" />
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm">No milestones achieved yet</p>
          </div>
        )}
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs mb-2">Next Milestone</p>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold">{nextMilestone.name}</p>
              
            </div>
            <span className="text-3xl">{nextMilestone.icon}</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{formatMoney(currentNetWorth, currency)}</span>
              <span>{formatMoney(nextMilestone.threshold, currency)}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ 
                  width: `${Math.min(100, (currentNetWorth / nextMilestone.threshold) * 100)}%` 
                }}
              />
            </div>
          </div>
          <p className="text-slate-500 text-xs text-center">
            {formatMoney(nextMilestone.threshold - currentNetWorth, currency)} to go!
          </p>
        </div>
      )}
    </NeonCard>
  );
}