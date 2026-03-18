import React, { useState } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '../ui/NeonCard';
import NeonButton from '../ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Info } from 'lucide-react';

export default function VariableIncomeSetup({ 
  monthlyIncome, 
  onSave, 
  existingAllocations = [],
  currency = 'USD'
}) {
  const [allocations, setAllocations] = useState(existingAllocations.length > 0 ? existingAllocations : [
    { name: 'Essential Expenses', percentage: 50, color: '#06b6d4' },
    { name: 'Savings & Goals', percentage: 20, color: '#22c55e' },
    { name: 'Discretionary', percentage: 30, color: '#a855f7' },
  ]);

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const isValid = totalPercentage === 100;

  const updatePercentage = (index, value) => {
    const newAllocations = [...allocations];
    newAllocations[index].percentage = value;
    setAllocations(newAllocations);
  };

  return (
    <NeonCard className="p-4 sm:p-5" glowColor="purple">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-purple-500/20">
          <TrendingUp className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Variable Income Budgeting</h3>
          <p className="text-slate-400 text-sm">Allocate by percentage of income</p>
        </div>
      </div>

      {monthlyIncome ? (
        <>
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
            <p className="text-slate-400 text-sm">Monthly Income</p>
            <p className="text-2xl font-bold text-white">{formatMoney(monthlyIncome, currency)}</p>
          </div>

          <div className="space-y-4">
            {allocations.map((allocation, index) => (
              <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-slate-300">{allocation.name}</Label>
                  <div className="text-right">
                    <p className="text-white font-semibold">{allocation.percentage}%</p>
                    <p className="text-cyan-400 text-sm">
                      {formatMoney((monthlyIncome * allocation.percentage) / 100, currency)}
                    </p>
                  </div>
                </div>
                <Slider
                  value={[allocation.percentage]}
                  onValueChange={(value) => updatePercentage(index, value[0])}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            ))}
          </div>

          <div className={`mt-4 p-3 rounded-lg ${
            isValid ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${isValid ? 'text-green-400' : 'text-red-400'}`} />
              <p className={`text-sm ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                Total: {totalPercentage}% {isValid ? '✓' : '(must equal 100%)'}
              </p>
            </div>
          </div>

          <NeonButton 
            onClick={() => onSave(allocations)}
            disabled={!isValid}
            className="w-full mt-4"
          >
            Apply Variable Budget
          </NeonButton>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm">Add income transactions to use variable budgeting</p>
        </div>
      )}
    </NeonCard>
  );
}