import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import { formatMoneyWithCode, formatMoney, GRC } from '../currency/currencyHierarchy';
import { ArrowRight, TrendingUp, Plus, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth } from 'date-fns';

const COUNTRY_FLAGS = {
  QA: '🇶🇦', EG: '🇪🇬', US: '🇺🇸', GB: '🇬🇧', SA: '🇸🇦', AE: '🇦🇪',
  IN: '🇮🇳', PK: '🇵🇰', BD: '🇧🇩', PH: '🇵🇭', ID: '🇮🇩', MY: '🇲🇾'
};

export default function RemittanceFlows({
  remittances,
  goals,
  baseCurrency,
  onAddRemittance,
  onManageGoals
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // This month's remittances
  const thisMonthRemittances = remittances.filter((r) => {
    const date = new Date(r.date);
    return date >= monthStart && date <= monthEnd;
  });

  // Group by route (from -> to)
  const flowsMap = thisMonthRemittances.reduce((acc, r) => {
    const key = `${r.fromCountryCode || r.from_country}->${r.toCountryCode || r.to_country}`;
    if (!acc[key]) {
      acc[key] = {
        fromCountry: r.fromCountryCode || r.from_country,
        toCountry: r.toCountryCode || r.to_country,
        fromFlag: COUNTRY_FLAGS[r.fromCountryCode || r.from_country] || '🌍',
        toFlag: COUNTRY_FLAGS[r.toCountryCode || r.to_country] || '🌍',
        totalSent: 0,
        totalReceived: 0,
        sentCurrency: r.sentCurrency || r.currency,
        receivedCurrency: r.receivedCurrency || r.currency_received,
        count: 0,
        transfers: []
      };
    }
    acc[key].totalSent += r.sentAmount || r.amount;
    acc[key].totalReceived += r.receivedAmount || r.amount_received || 0;
    acc[key].count += 1;
    acc[key].transfers.push(r);
    return acc;
  }, {});

  const flows = Object.values(flowsMap);
  
  // Calculate total sent in USD (GRC) using stored snapshots
  const totalSentUSD = thisMonthRemittances.reduce((sum, r) => {
    // Use stored USD snapshot if available, fallback to sent amount
    const usdAmount = r.usdSentAmount || r.sentAmount || r.amount || 0;
    return sum + usdAmount;
  }, 0);

  return (
    <NeonCard className="p-5" glowColor="purple">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">💸 Money Flows</h3>
          <p className="text-slate-400 text-sm">{format(now, 'MMMM yyyy')}</p>
        </div>
        <NeonButton size="sm" variant="secondary" onClick={onAddRemittance}>
          <Plus className="w-4 h-4" />
          Log Transfer
        </NeonButton>
      </div>

      {flows.length > 0 ?
      <div className="space-y-3 mb-4">
          {flows.map((flow, idx) =>
        <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{flow.fromFlag}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-xl">{flow.toFlag}</span>
                  <div>
                    <p className="text-white font-medium">{flow.fromCountry} → {flow.toCountry}</p>
                    <p className="text-slate-500 text-xs">{flow.count} transfer{flow.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-cyan-400 font-bold text-sm">
                    Sent: {formatMoneyWithCode(flow.totalSent, flow.sentCurrency, { decimals: 0 })}
                  </p>
                  <p className="text-green-400 text-xs">
                    Received: {formatMoneyWithCode(flow.totalReceived, flow.receivedCurrency, { decimals: 0, approximate: true })}
                  </p>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {flow.transfers[0]?.sourceLabel && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>From: {flow.transfers[0].sourceLabel}</span>
                    {flow.transfers[0].destinationLabel && (
                      <>
                        <span>→</span>
                        <span>To: {flow.transfers[0].destinationLabel}</span>
                      </>
                    )}
                  </div>
                )}
                {flow.transfers[0]?.effectiveRate && (
                  <p className="text-xs text-slate-500">
                    Rate: 1 {flow.sentCurrency} ≈ {flow.transfers[0].effectiveRate.toFixed(4)} {flow.receivedCurrency} (ExchangeRate)
                  </p>
                )}
              </div>
            </div>
        )}
        </div> :

      <div className="text-center py-6 mb-4">
          <p className="text-slate-400 text-sm">No transfers logged this month</p>
        </div>
      }

      <div className="pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <p className="text-slate-300">Total Sent This Month (USD)</p>
            <div className="group relative">
              <Info className="w-3 h-3 text-slate-500" />
              <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 p-2 bg-slate-800 text-xs text-slate-300 rounded whitespace-nowrap z-10">
                Converted to USD for global reporting
              </div>
            </div>
          </div>
          <p className="text-white font-bold text-lg">{formatMoney(totalSentUSD, GRC, { decimals: 0 })}</p>
        </div>

        {goals.length > 0 && goals.map((goal) => {
          const goalRemittances = thisMonthRemittances.filter((r) => (r.toCountryCode || r.to_country) === goal.to_country);
          const sent = goalRemittances.reduce((sum, r) => sum + (r.sentAmount || r.amount), 0);
          const target = goal.target_amount;
          const percentage = target ? sent / target * 100 : 0;

          return (
            <div key={goal.id} className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">{goal.name}</p>
                <p className="text-cyan-400 text-sm">{formatCurrency(sent, baseCurrency)} / {formatCurrency(target, baseCurrency)}</p>
              </div>
              <NeonProgress
                value={sent}
                max={target}
                color={percentage >= 100 ? 'green' : 'cyan'}
                showLabel={false} />

            </div>);

        })}

        <NeonButton
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={onManageGoals}>

          {goals.length > 0 ? 'Manage Goals' : 'Set Remittance Goal'}
        </NeonButton>
      </div>
    </NeonCard>);

}