import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HealthScoreCard({ score, label, color, lastUpdated, status, scoreChange }) {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const colors = {
    red: { bg: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/30', text: 'text-red-400', glow: 'pink' },
    yellow: { bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'purple' },
    lightgreen: { bg: 'from-green-500/20 to-teal-500/20', border: 'border-green-500/30', text: 'text-green-400', glow: 'teal' },
    green: { bg: 'from-green-400/20 to-cyan-400/20', border: 'border-green-400/30', text: 'text-green-300', glow: 'green' },
  };

  const colorConfig = colors[color] || colors.yellow;
  const percentage = score ? (score / 100) * 283 : 0; // circumference of circle
  
  // Don't render if no data
  if (status === 'no_data' || score === null) {
    return null;
  }

  const handleClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    navigate(createPageUrl('HealthScore'));
  };

  return (
    <motion.div
      animate={{ scale: isPressed ? 0.98 : 1 }}
      transition={{ duration: 0.1 }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onClick={handleClick}
      className="cursor-pointer"
      style={{ touchAction: 'manipulation' }}
    >
      <NeonCard className={`p-5 bg-gradient-to-br ${colorConfig.bg} border ${colorConfig.border} transition-all duration-100 ${isPressed ? 'shadow-[0_0_30px_rgba(0,255,255,0.25)]' : ''}`} glowColor={colorConfig.glow}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${colorConfig.text}`} />
            <h3 className="text-white font-semibold">Financial Health Score</h3>
          </div>
          <ChevronRight className={`w-5 h-5 transition-all duration-200 ${isPressed ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]' : 'text-slate-400'}`} />
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-28 h-28">
            <svg className="transform -rotate-90 w-28 h-28">
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray="283"
                strokeDashoffset={283 - percentage}
                className={`${colorConfig.text} transition-all duration-1000`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-white">{score}</p>
              <p className="text-slate-400 text-xs">/ 100</p>
            </div>
          </div>

          <div className="flex-1 ml-6">
            <div className="flex flex-col gap-1 mb-2">
              <div className={`inline-block px-3 py-1 rounded-full ${colorConfig.bg} self-start`}>
                <p className={`${colorConfig.text} font-semibold text-sm`}>{label}</p>
              </div>
              
              {status === 'early_estimate' && (
                <div className="inline-block px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 self-start">
                  <p className="text-yellow-400 text-xs">Early estimate</p>
                </div>
              )}
            </div>
            
            {scoreChange !== null && !isNaN(scoreChange) && status !== 'early_estimate' && (
              <div className={`inline-flex items-center gap-1 text-xs mb-2 ${
                scoreChange > 0 ? 'text-green-400' : scoreChange < 0 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {scoreChange > 0 ? '▲' : scoreChange < 0 ? '▼' : '●'}
                <span>{scoreChange > 0 ? '+' : ''}{scoreChange} vs last month</span>
              </div>
            )}
            
            <p className="text-slate-400 text-sm mb-3">
              {status === 'early_estimate' 
                ? 'Score will improve with more tracking' 
                : `Your health is looking ${label.toLowerCase()}`}
            </p>
            
            <NeonButton size="sm" variant="ghost" className="text-cyan-400">
              View Details
            </NeonButton>
          </div>
        </div>
      </NeonCard>
    </motion.div>
  );
}