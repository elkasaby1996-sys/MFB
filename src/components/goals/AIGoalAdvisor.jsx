import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Sparkles, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInMonths } from 'date-fns';

export default function AIGoalAdvisor({ goals, transactions, profile }) {
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAIAdvice = async () => {
    setIsLoading(true);
    try {
      const currency = profile?.currency || 'USD';
      
      // Calculate savings rate
      const recentTransactions = transactions.slice(0, 90);
      const income = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) / 3;
      const expenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) / 3;
      const monthlySavings = income - expenses;

      // Analyze goals
      const activeGoals = goals.filter(g => ((parseFloat(g.current_amount) || 0) / (parseFloat(g.target_amount) || 1)) < 1);
      const goalDetails = activeGoals.map(g => {
        const remaining = (parseFloat(g.target_amount) || 0) - (parseFloat(g.current_amount) || 0);
        const monthsLeft = g.target_date ? differenceInMonths(new Date(g.target_date), new Date()) : null;
        const requiredMonthly = monthsLeft > 0 ? remaining / monthsLeft : null;
        
        return {
          name: g.name,
          target: parseFloat(g.target_amount) || 0,
          current: parseFloat(g.current_amount) || 0,
          remaining: remaining,
          targetDate: g.target_date,
          monthsLeft: monthsLeft,
          requiredMonthly: requiredMonthly,
          progress: (((parseFloat(g.current_amount) || 0) / (parseFloat(g.target_amount) || 1)) * 100).toFixed(1),
        };
      });

      const prompt = `You are a personal finance AI advisor specializing in goal planning. Analyze this user's financial goals and provide strategic advice.

User Financial Profile:
- Currency: ${currency}
- Monthly Income: ${income.toFixed(0)}
- Monthly Expenses: ${expenses.toFixed(0)}
- Monthly Savings: ${monthlySavings.toFixed(0)}
- Current Savings Rate: ${income > 0 ? ((monthlySavings / income) * 100).toFixed(1) : '0'}%

Active Goals:
${goalDetails.map(g => `
- ${g.name}:
  • Target: ${g.target}
  • Current: ${g.current} (${g.progress}% complete)
  • Remaining: ${g.remaining}
  • Target Date: ${g.targetDate || 'Not set'}
  • Time Left: ${g.monthsLeft ? g.monthsLeft + ' months' : 'Not set'}
  • Required Monthly Savings: ${g.requiredMonthly ? g.requiredMonthly.toFixed(0) : 'N/A'}
`).join('\n')}

Total Goals: ${activeGoals.length}

Provide personalized goal advice including:
1. Realistic assessment of each goal's timeline based on current savings rate
2. Prioritization recommendations (which goals to focus on first)
3. Specific monthly savings targets for each goal
4. Budget optimization tips to accelerate progress
5. Timeline adjustments if goals are unrealistic
6. Motivation and actionable next steps

Keep the tone friendly, empowering, and practical. Use "bro" occasionally. Format with clear sections.`;

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
        <h3 className="text-white font-semibold">AI Goal Advisor</h3>
      </div>

      {!advice ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-300 mb-1">Get AI-powered goal insights</p>
          <p className="text-slate-400 text-sm mb-4">
            Receive realistic timelines and savings strategies
          </p>
          <NeonButton
            onClick={getAIAdvice}
            loading={isLoading}
            variant="purple"
            className="mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Analyze My Goals
          </NeonButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 max-h-80 overflow-y-auto">
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
            Refresh Analysis
          </NeonButton>
        </div>
      )}
    </NeonCard>
  );
}