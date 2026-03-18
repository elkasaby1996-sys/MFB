import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Sparkles, TrendingDown, AlertCircle, Target, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIDebtAdvisor({ debts, profile, transactions }) {
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAIAdvice = async () => {
    setIsLoading(true);
    try {
      const currency = profile?.currency || 'USD';
      const activeDebts = debts.filter(d => d.status === 'active');
      
      const totalDebt = activeDebts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
      const totalMinPayment = activeDebts.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);
      
      // CRITICAL: Only calculate avg interest if at least one debt has APR
      const debtsWithAPR = activeDebts.filter(d => d.interest_rate !== null && d.interest_rate !== undefined);
      const avgInterest = debtsWithAPR.length > 0 && totalDebt > 0
        ? debtsWithAPR.reduce((sum, d) => sum + ((d.interest_rate || 0) * (d.current_balance || 0)), 0) / totalDebt
        : 0;

      // Calculate recent income and expenses - prevent NaN
      const recentTransactions = transactions.slice(0, 60);
      const incomeTotal = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const expensesTotal = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const monthlyIncome = incomeTotal > 0 ? incomeTotal / 2 : 0;
      const monthlyExpenses = expensesTotal > 0 ? expensesTotal / 2 : 0;

      const prompt = `You are a personal finance AI advisor specializing in debt management. Analyze this user's debt situation and provide strategic advice.

User Financial Profile:
- Currency: ${currency}
- Monthly Income: ${monthlyIncome.toFixed(0)}
- Monthly Expenses: ${monthlyExpenses.toFixed(0)}
- Total Debt: ${totalDebt.toFixed(0)}
- Number of Active Debts: ${activeDebts.length}
- Average Interest Rate: ${avgInterest.toFixed(2)}%
- Total Minimum Payments: ${totalMinPayment.toFixed(0)}

Debt Details:
${activeDebts.map(d => `- ${d.name}: Balance ${d.current_balance}, APR ${d.interest_rate}%, Min Payment ${d.minimum_payment}`).join('\n')}

Provide personalized debt management advice including:
1. Recommended repayment strategy (Avalanche vs Snowball) with justification
2. Specific action steps to accelerate debt payoff
3. Budget optimization suggestions
4. Potential money-saving tips
5. Motivational insights

Keep the tone friendly, empowering, and actionable. Use "bro" style language occasionally. Format your response in clear sections.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
      });

      setAdvice(response);
    } catch (error) {
      console.error('AI advice error:', error);
      toast.error('Failed to get AI advice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NeonCard className="p-5" glowColor="purple">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold">AI Debt Advisor</h3>
      </div>

      {!advice ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-300 mb-1">Get personalized debt advice</p>
          <p className="text-slate-400 text-sm mb-4">
            AI will analyze your debts and provide tailored strategies
          </p>
          <NeonButton
            onClick={getAIAdvice}
            loading={isLoading}
            variant="purple"
            className="mx-auto"
          >
            Get AI Advice
          </NeonButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 max-h-96 overflow-y-auto">
            <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
              {advice}
            </div>
          </div>
          <NeonButton
            onClick={getAIAdvice}
            loading={isLoading}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            Refresh Advice
          </NeonButton>
        </div>
      )}
    </NeonCard>
  );
}