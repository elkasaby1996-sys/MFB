import React, { useState } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingDown, DollarSign } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function DebtCalculators({ currency = 'USD' }) {
  const [payoffCalc, setPayoffCalc] = useState({
    balance: '',
    interestRate: '',
    monthlyPayment: '',
    result: null,
  });

  const [consolidationCalc, setConsolidationCalc] = useState({
    debt1: '',
    rate1: '',
    debt2: '',
    rate2: '',
    newRate: '',
    result: null,
  });

  const calculatePayoff = () => {
    const balance = parseFloat(payoffCalc.balance);
    const rate = parseFloat(payoffCalc.interestRate);
    const payment = parseFloat(payoffCalc.monthlyPayment);

    if (!balance || !rate || !payment) return;

    const monthlyRate = (rate / 100) / 12;
    let remaining = balance;
    let months = 0;
    let totalInterest = 0;

    while (remaining > 0 && months < 600) {
      const interest = remaining * monthlyRate;
      totalInterest += interest;
      remaining = remaining + interest - payment;
      months++;

      if (payment <= interest) {
        setPayoffCalc(prev => ({
          ...prev,
          result: { error: 'Payment too low to cover interest' }
        }));
        return;
      }
    }

    const totalPaid = balance + totalInterest;
    
    setPayoffCalc(prev => ({
      ...prev,
      result: {
        months,
        years: (months / 12).toFixed(1),
        totalPaid,
        totalInterest,
      }
    }));
  };

  const calculateConsolidation = () => {
    const debt1 = parseFloat(consolidationCalc.debt1);
    const rate1 = parseFloat(consolidationCalc.rate1);
    const debt2 = parseFloat(consolidationCalc.debt2);
    const rate2 = parseFloat(consolidationCalc.rate2);
    const newRate = parseFloat(consolidationCalc.newRate);

    if (!debt1 || !rate1 || !debt2 || !rate2 || !newRate) return;

    const totalDebt = debt1 + debt2;
    
    // Calculate original interest over 5 years
    const originalInterest1 = (debt1 * (rate1 / 100) * 5);
    const originalInterest2 = (debt2 * (rate2 / 100) * 5);
    const originalTotal = originalInterest1 + originalInterest2;

    // Calculate consolidated interest over 5 years
    const consolidatedInterest = totalDebt * (newRate / 100) * 5;
    
    const savings = originalTotal - consolidatedInterest;
    const savingsPercent = ((savings / originalTotal) * 100);

    setConsolidationCalc(prev => ({
      ...prev,
      result: {
        totalDebt,
        originalInterest: originalTotal,
        consolidatedInterest,
        savings,
        savingsPercent,
      }
    }));
  };

  return (
    <NeonCard className="p-5" glowColor="blue">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold">Debt Calculators</h3>
      </div>

      <Tabs defaultValue="payoff" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="payoff" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Payoff
          </TabsTrigger>
          <TabsTrigger value="consolidation" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Consolidation
          </TabsTrigger>
        </TabsList>

        {/* Payoff Calculator */}
        <TabsContent value="payoff" className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300 text-sm">Current Balance</Label>
            <Input
              type="number"
              value={payoffCalc.balance}
              onChange={(e) => setPayoffCalc(prev => ({ ...prev, balance: e.target.value, result: null }))}
              placeholder="10000"
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Interest Rate (APR %)</Label>
            <Input
              type="number"
              value={payoffCalc.interestRate}
              onChange={(e) => setPayoffCalc(prev => ({ ...prev, interestRate: e.target.value, result: null }))}
              placeholder="18.5"
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Monthly Payment</Label>
            <Input
              type="number"
              value={payoffCalc.monthlyPayment}
              onChange={(e) => setPayoffCalc(prev => ({ ...prev, monthlyPayment: e.target.value, result: null }))}
              placeholder="300"
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          <NeonButton onClick={calculatePayoff} variant="primary" className="w-full">
            <TrendingDown className="w-4 h-4" />
            Calculate Payoff
          </NeonButton>

          {payoffCalc.result && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 space-y-2">
              {payoffCalc.result.error ? (
                <p className="text-red-400 text-sm">⚠️ {payoffCalc.result.error}</p>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Time to payoff:</span>
                    <span className="text-cyan-400 font-bold">
                      {payoffCalc.result.months} months ({payoffCalc.result.years} years)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Total interest:</span>
                    <span className="text-orange-400 font-bold">{formatMoney(payoffCalc.result.totalInterest, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Total paid:</span>
                    <span className="text-white font-bold">{formatMoney(payoffCalc.result.totalPaid, currency)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* Consolidation Calculator */}
        <TabsContent value="consolidation" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm">Debt 1 Balance</Label>
              <Input
                type="number"
                value={consolidationCalc.debt1}
                onChange={(e) => setConsolidationCalc(prev => ({ ...prev, debt1: e.target.value, result: null }))}
                placeholder="5000"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Rate 1 (%)</Label>
              <Input
                type="number"
                value={consolidationCalc.rate1}
                onChange={(e) => setConsolidationCalc(prev => ({ ...prev, rate1: e.target.value, result: null }))}
                placeholder="24"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm">Debt 2 Balance</Label>
              <Input
                type="number"
                value={consolidationCalc.debt2}
                onChange={(e) => setConsolidationCalc(prev => ({ ...prev, debt2: e.target.value, result: null }))}
                placeholder="3000"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Rate 2 (%)</Label>
              <Input
                type="number"
                value={consolidationCalc.rate2}
                onChange={(e) => setConsolidationCalc(prev => ({ ...prev, rate2: e.target.value, result: null }))}
                placeholder="18"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">New Consolidated Rate (%)</Label>
            <Input
              type="number"
              value={consolidationCalc.newRate}
              onChange={(e) => setConsolidationCalc(prev => ({ ...prev, newRate: e.target.value, result: null }))}
              placeholder="12"
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          <NeonButton onClick={calculateConsolidation} variant="primary" className="w-full">
            <DollarSign className="w-4 h-4" />
            Calculate Savings
          </NeonButton>

          {consolidationCalc.result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total debt:</span>
                <span className="text-white font-bold">{formatMoney(consolidationCalc.result.totalDebt, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Original interest (5y):</span>
                <span className="text-red-400 font-medium">{formatMoney(consolidationCalc.result.originalInterest, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Consolidated interest (5y):</span>
                <span className="text-orange-400 font-medium">{formatMoney(consolidationCalc.result.consolidatedInterest, currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-400 text-sm">Potential savings:</span>
                <span className="text-green-400 font-bold">
                  {formatMoney(consolidationCalc.result.savings, currency)} ({consolidationCalc.result.savingsPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </NeonCard>
  );
}