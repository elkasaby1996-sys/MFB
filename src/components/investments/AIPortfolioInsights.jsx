import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { base44 } from '@/api/base44Client';
import { Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AIPortfolioInsights({ investments, currency = 'USD' }) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const totalInvested = investments.reduce((sum, i) => sum + (parseFloat(i.amount_invested) || 0), 0);
      const totalValue = investments.reduce((sum, i) => sum + (parseFloat(i.current_value) || parseFloat(i.amount_invested) || 0), 0);
      const totalReturn = totalInvested > 0 ? (((totalValue - totalInvested) / totalInvested) * 100).toFixed(2) : '0.00';

      // Analyze diversification
      const typeMap = {};
      const sectorMap = {};
      const geoMap = {};
      
      investments.forEach(inv => {
        const value = parseFloat(inv.current_value || inv.amount_invested) || 0;
        typeMap[inv.type] = (typeMap[inv.type] || 0) + value;
        if (inv.sector) sectorMap[inv.sector] = (sectorMap[inv.sector] || 0) + value;
        if (inv.geography) geoMap[inv.geography] = (geoMap[inv.geography] || 0) + value;
      });

      const prompt = `You are an expert investment advisor. Analyze this portfolio and provide AI-driven insights on risks and opportunities.

Portfolio Summary:
- Total Value: ${currency} ${totalValue.toFixed(0)}
- Total Invested: ${currency} ${totalInvested.toFixed(0)}
- Return: ${totalReturn}%
- Number of Holdings: ${investments.length}

Asset Class Allocation:
${Object.entries(typeMap).map(([type, val]) => `- ${type}: ${totalValue > 0 ? ((val/totalValue)*100).toFixed(1) : '0'}%`).join('\n')}

${Object.keys(sectorMap).length > 0 ? `Sector Allocation:
${Object.entries(sectorMap).map(([sec, val]) => `- ${sec}: ${totalValue > 0 ? ((val/totalValue)*100).toFixed(1) : '0'}%`).join('\n')}` : ''}

${Object.keys(geoMap).length > 0 ? `Geographic Allocation:
${Object.entries(geoMap).map(([geo, val]) => `- ${geo}: ${totalValue > 0 ? ((val/totalValue)*100).toFixed(1) : '0'}%`).join('\n')}` : ''}

Top Holdings:
${investments.slice(0, 5).map(i => `- ${i.name}: ${currency} ${(parseFloat(i.current_value) || parseFloat(i.amount_invested) || 0).toFixed(0)}`).join('\n')}

Provide:
1. **Risk Assessment**: Identify concentration risks, sector/geographic overexposure, and volatility concerns
2. **Diversification Score**: Rate diversification from 1-10 with explanation
3. **Opportunities**: Suggest underrepresented sectors or asset classes
4. **Rebalancing Recommendations**: Specific actions to optimize the portfolio
5. **Market Outlook**: Brief commentary on current positions given market conditions

Keep it concise, actionable, and friendly. Use "bro" occasionally.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
      });

      setInsights(result);
      toast.success('Insights generated');
    } catch (error) {
      console.error('AI insights error:', error);
      toast.error('Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NeonCard className="p-5" glowColor="purple">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold">AI Portfolio Insights</h3>
      </div>

      {!insights ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-300 mb-2">Get AI-powered portfolio analysis</p>
          <p className="text-slate-400 text-sm mb-4">
            Identify risks, opportunities, and optimization strategies
          </p>
          <NeonButton
            onClick={generateInsights}
            loading={isLoading}
            variant="purple"
          >
            <Sparkles className="w-4 h-4" />
            Generate Insights
          </NeonButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 max-h-96 overflow-y-auto">
            <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
              {insights}
            </div>
          </div>
          <NeonButton
            onClick={generateInsights}
            loading={isLoading}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <Sparkles className="w-4 h-4" />
            Refresh Analysis
          </NeonButton>
        </div>
      )}
    </NeonCard>
  );
}