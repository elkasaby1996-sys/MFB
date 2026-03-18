import React, { useState } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import { Zap, Target, TrendingDown } from "lucide-react";

export default function PayoffStrategy({ debts, currency = 'USD' }) {
  const [selectedStrategy, setSelectedStrategy] = useState('avalanche');

  const activeDebts = debts.filter(d => d.status === 'active');

  // Avalanche: Highest interest rate first - CRITICAL: Handle null APR
  const avalancheOrder = [...activeDebts].sort((a, b) => 
    (b.interest_rate || 0) - (a.interest_rate || 0)
  );

  // Snowball: Smallest balance first
  const snowballOrder = [...activeDebts].sort((a, b) => 
    (a.current_balance || 0) - (b.current_balance || 0)
  );

  const calculateTotalInterest = (order) => {
    let totalInterest = 0;

    order.forEach(debt => {
      // CRITICAL: Use 0 if APR is null, prevent NaN
      const monthlyRate = debt.interest_rate !== null && debt.interest_rate !== undefined
        ? (debt.interest_rate / 100) / 12
        : 0;
      let balance = debt.current_balance || 0;
      const payment = debt.preferred_payment || debt.minimum_payment || 0;

      if (balance <= 0 || payment <= 0) return;

      let iterations = 0;
      const maxIterations = 600;

      while (balance > 0.01 && iterations < maxIterations) {
        const interest = balance * monthlyRate;
        totalInterest += interest;
        balance = balance + interest - payment;
        iterations++;
        
        // If payment doesn't cover interest, stop
        if (monthlyRate > 0 && payment <= interest * 1.01) break;
      }
    });

    return totalInterest;
  };

  // Calculate which method saves more - prevent NaN
  const avalancheInterest = calculateTotalInterest(avalancheOrder);
  const snowballInterest = calculateTotalInterest(snowballOrder);
  const interestSavings = !isNaN(snowballInterest) && !isNaN(avalancheInterest) && isFinite(snowballInterest) && isFinite(avalancheInterest)
    ? snowballInterest - avalancheInterest
    : 0;

  const strategies = {
    avalanche: {
      name: 'Avalanche Method',
      icon: TrendingDown,
      description: 'Pay highest interest rate first',
      pros: 'Saves the most money on interest',
      order: avalancheOrder,
      color: 'cyan',
      savings: interestSavings > 0 ? formatMoney(interestSavings, currency) : null,
    },
    snowball: {
      name: 'Snowball Method',
      icon: Target,
      description: 'Pay smallest balance first',
      pros: 'Quick wins for motivation',
      order: snowballOrder,
      color: 'purple',
      psychological: true,
    },
  };

  const currentStrategy = strategies[selectedStrategy];
  const Icon = currentStrategy.icon;

  if (activeDebts.length === 0) return null;

  return (
    <NeonCard className="p-5" glowColor={currentStrategy.color}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Payoff Strategy</h3>
      </div>

      {/* Strategy Toggle */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Object.entries(strategies).map(([key, strategy]) => {
          const StratIcon = strategy.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedStrategy(key)}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedStrategy === key
                  ? `border-${strategy.color}-500 bg-${strategy.color}-500/20`
                  : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50'
              }`}
            >
              <StratIcon className={`w-5 h-5 mb-1 mx-auto ${
                selectedStrategy === key ? `text-${strategy.color}-400` : 'text-slate-400'
              }`} />
              <p className={`text-xs font-medium ${
                selectedStrategy === key ? 'text-white' : 'text-slate-400'
              }`}>
                {strategy.name.replace(' Method', '')}
              </p>
            </button>
          );
        })}
      </div>

      {/* Strategy Info */}
      <div className="bg-slate-800/30 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <Icon className={`w-6 h-6 text-${currentStrategy.color}-400 mt-1`} />
          <div>
            <p className="text-white font-semibold mb-1">{currentStrategy.name}</p>
            <p className="text-slate-400 text-sm">{currentStrategy.description}</p>
            <p className="text-cyan-400 text-xs mt-1">✓ {currentStrategy.pros}</p>
            {currentStrategy.savings && (
              <p className="text-green-400 text-xs mt-1">💰 Saves {currentStrategy.savings} vs Snowball</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Order */}
      <div>
        <p className="text-slate-400 text-sm mb-3">Recommended payment order:</p>
        <div className="space-y-2">
          {currentStrategy.order.map((debt, index) => (
            <div
              key={debt.id}
              className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3"
            >
              <div className={`w-8 h-8 rounded-lg bg-${currentStrategy.color}-500/20 flex items-center justify-center`}>
                <span className={`text-${currentStrategy.color}-400 font-bold`}>{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{debt.name}</p>
                <p className="text-slate-400 text-xs">
                  {formatMoney(debt.current_balance, currency)} • {debt.interest_rate !== null && debt.interest_rate !== undefined ? `${debt.interest_rate}% APR` : 'APR not set'}
                </p>
              </div>
              {selectedStrategy === 'avalanche' && (
                <span className="text-orange-400 text-xs font-medium">
                  {debt.interest_rate !== null && debt.interest_rate !== undefined ? `${debt.interest_rate}%` : '—'}
                </span>
              )}
              {selectedStrategy === 'snowball' && (
                <span className="text-purple-400 text-xs font-medium">{formatMoney(debt.current_balance, currency)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </NeonCard>
  );
}