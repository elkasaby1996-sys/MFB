import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function BenchmarkComparison({ investments, timeframe = '1Y' }) {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBenchmarkData = async () => {
    setIsLoading(true);
    try {
      const totalInvested = investments.reduce((sum, i) => sum + (parseFloat(i.amount_invested) || 0), 0);
      const totalValue = investments.reduce((sum, i) => sum + (parseFloat(i.current_value) || parseFloat(i.amount_invested) || 0), 0);
      const portfolioReturn = totalInvested > 0 ? (((totalValue - totalInvested) / totalInvested) * 100).toFixed(2) : '0.00';

      const prompt = `I need S&P 500 and Nasdaq performance data for the last ${timeframe}.
      
My portfolio return: ${portfolioReturn}%

Provide:
1. S&P 500 return for this period (%)
2. Nasdaq return for this period (%)
3. Monthly data points for the last 6 months showing cumulative returns

Format the response as JSON with structure:
{
  "sp500_return": number,
  "nasdaq_return": number,
  "monthly_data": [
    { "month": "string", "portfolio": number, "sp500": number, "nasdaq": number }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sp500_return: { type: "number" },
            nasdaq_return: { type: "number" },
            monthly_data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  portfolio: { type: "number" },
                  sp500: { type: "number" },
                  nasdaq: { type: "number" }
                }
              }
            }
          }
        }
      });

      setBenchmarkData({
        ...result,
        portfolio_return: parseFloat(portfolioReturn)
      });
      toast.success('Benchmark data updated');
    } catch (error) {
      console.error('Benchmark fetch error:', error);
      toast.error('Failed to fetch benchmark data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NeonCard className="p-5" glowColor="green">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-white font-semibold">Benchmark Comparison</h3>
        </div>
        <NeonButton
          size="sm"
          variant="secondary"
          onClick={fetchBenchmarkData}
          loading={isLoading}
        >
          <RefreshCw className="w-4 h-4" />
          {!benchmarkData && 'Load'}
        </NeonButton>
      </div>

      {!benchmarkData ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-slate-300 mb-2">Compare your performance</p>
          <p className="text-slate-400 text-sm mb-4">
            See how your portfolio stacks up against S&P 500 and Nasdaq
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Performance Bars */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Your Portfolio</p>
              <p className={`font-bold text-lg ${benchmarkData.portfolio_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {benchmarkData.portfolio_return >= 0 ? '+' : ''}{benchmarkData.portfolio_return}%
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">S&P 500</p>
              <p className={`font-bold text-lg ${benchmarkData.sp500_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {benchmarkData.sp500_return >= 0 ? '+' : ''}{benchmarkData.sp500_return}%
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Nasdaq</p>
              <p className={`font-bold text-lg ${benchmarkData.nasdaq_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {benchmarkData.nasdaq_return >= 0 ? '+' : ''}{benchmarkData.nasdaq_return}%
              </p>
            </div>
          </div>

          {/* Performance Chart */}
          {benchmarkData.monthly_data && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={benchmarkData.monthly_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="portfolio" stroke="#22c55e" strokeWidth={3} name="Your Portfolio" />
                  <Line type="monotone" dataKey="sp500" stroke="#06b6d4" strokeWidth={2} name="S&P 500" />
                  <Line type="monotone" dataKey="nasdaq" stroke="#a855f7" strokeWidth={2} name="Nasdaq" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Outperformance Indicator */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            {benchmarkData.portfolio_return > benchmarkData.sp500_return ? (
              <p className="text-green-400 text-sm">
                🎉 Outperforming S&P 500 by {(benchmarkData.portfolio_return - benchmarkData.sp500_return).toFixed(2)}%
              </p>
            ) : (
              <p className="text-slate-400 text-sm">
                Underperforming S&P 500 by {(benchmarkData.sp500_return - benchmarkData.portfolio_return).toFixed(2)}%
              </p>
            )}
          </div>
        </div>
      )}
    </NeonCard>
  );
}