import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import NeonCard from '../ui/NeonCard';
import { getLifestyleLevel } from './calculateLifestyleScores';

export default function LifestyleTagCard({
  tag,
  score,
  shortDesc,
  details,
  improvements,
}) {
  const [expanded, setExpanded] = useState(false);
  const levelInfo = getLifestyleLevel(score);

  return (
    <NeonCard 
      className="p-5 cursor-pointer hover:scale-[1.01] transition-transform"
      onClick={() => setExpanded(!expanded)}
      glowColor={levelInfo.color === 'green' ? 'green' : levelInfo.color === 'yellow' ? 'blue' : 'pink'}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{tag.emoji}</div>
          <div>
            <h3 className="text-lg font-bold text-white">{tag.name}</h3>
            <div className={cn(
              "inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1",
              levelInfo.bgColor,
              levelInfo.textColor
            )}>
              {levelInfo.level}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{score}</div>
          <div className="text-xs text-slate-400">/10</div>
        </div>
      </div>

      {/* Short description with explanation */}
      <p className="text-slate-300 text-sm mb-3">{shortDesc}</p>
      
      {!expanded && details.length > 0 && (
        <div className="bg-slate-800/30 rounded-lg p-2 mb-2">
          <p className="text-slate-400 text-xs leading-relaxed">
            {details[0]?.label}: <span className="text-white font-medium">{details[0]?.value}</span>
          </p>
        </div>
      )}

      {/* Expand indicator */}
      <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs">
        <span>{expanded ? 'Hide Details' : 'View Details'}</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
          {/* Why this score */}
          <div>
            <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
              <span className="text-cyan-400">📊</span> Why you got this tag
            </h4>
            <div className="space-y-1.5">
              {details.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2">
                  <span className="text-slate-300 text-xs">{detail.label}</span>
                  <span className="text-white font-semibold text-xs">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions / Suggestions */}
          <div>
            <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
              <span className="text-green-400">💡</span> {levelInfo.level === 'High' ? 'How to improve' : 'Tips'}
            </h4>
            <ul className="space-y-1.5">
              {improvements.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </NeonCard>
  );
}