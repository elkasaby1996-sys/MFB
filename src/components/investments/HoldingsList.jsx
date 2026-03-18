import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { TrendingUp, TrendingDown, Trash2, Edit, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { calculateInvestmentMetrics, formatCurrency, formatPercent } from './investmentCalculations';

const INVESTMENT_TYPES = {
  stock: { icon: '📈', color: 'text-blue-400' },
  etf: { icon: '📊', color: 'text-purple-400' },
  crypto: { icon: '🪙', color: 'text-yellow-400' },
  metal: { icon: '🥇', color: 'text-amber-400' },
  bond: { icon: '📜', color: 'text-green-400' },
  real_estate: { icon: '🏠', color: 'text-pink-400' },
  other: { icon: '💼', color: 'text-slate-400' },
};

export default function HoldingsList({ investments, currency = 'USD', onEdit, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);

  const [fxRates, setFxRates] = useState({});

  useEffect(() => {
    fetchQuotesAndFX();
  }, [investments, currency]);

  const fetchQuotesAndFX = async () => {
    if (investments.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch quotes
      const instrumentIds = investments.map(inv => inv.instrumentId);
      const response = await base44.functions.invoke('market_batchQuotes', { instrumentIds });
      
      const quotesMap = {};
      response.data.quotes.forEach((quote, idx) => {
        quotesMap[investments[idx].instrumentId] = quote;
      });
      setQuotes(quotesMap);

      // Fetch FX rates for unique investment currencies using smart resolution
      const fxMap = {};
      const uniqueCurrencies = [...new Set(investments.map(inv => inv.investmentCurrency || inv.instrument?.instrumentCurrency).filter(Boolean))];
      
      await Promise.all(uniqueCurrencies.map(async (invCurrency) => {
        if (invCurrency === currency) {
          fxMap[invCurrency] = 1;
          return;
        }
        
        try {
          const fxResponse = await base44.functions.invoke('fx_getRate', {
            from: invCurrency,
            to: currency,
          });
          
          const rate = fxResponse.data.rate;
          if (rate !== null && rate !== undefined) {
            fxMap[invCurrency] = rate;
          } else {
            // Rate unavailable - use stored rate if available
            const inv = investments.find(i => (i.investmentCurrency || i.instrument?.instrumentCurrency) === invCurrency);
            fxMap[invCurrency] = inv?.lastFxRate || null;
          }
        } catch (error) {
          console.error(`Failed to fetch FX rate for ${invCurrency}:`, error);
          // Try to use last known rate from investments
          const inv = investments.find(i => (i.investmentCurrency || i.instrument?.instrumentCurrency) === invCurrency);
          fxMap[invCurrency] = inv?.lastFxRate || null;
        }
      }));
      
      setFxRates(fxMap);
    } catch (error) {
      console.error('Failed to fetch quotes and FX:', error);
    }
    setLoading(false);
  };

  // Sort by current value descending
  const sortedInvestments = [...investments].sort((a, b) => {
    const quoteA = quotes[a.instrumentId];
    const quoteB = quotes[b.instrumentId];
    
    const priceA = quoteA?.price || a.lastQuotePrice_asset || a.avgBuyPrice_asset;
    const priceB = quoteB?.price || b.lastQuotePrice_asset || b.avgBuyPrice_asset;
    const invCurrencyA = a.investmentCurrency || a.instrument?.instrumentCurrency;
    const invCurrencyB = b.investmentCurrency || b.instrument?.instrumentCurrency;
    const fxA = fxRates[invCurrencyA] || a.lastFxRate || 1;
    const fxB = fxRates[invCurrencyB] || b.lastFxRate || 1;
    
    const valueA = (a.quantity || 0) * priceA * fxA;
    const valueB = (b.quantity || 0) * priceB * fxB;
    
    return valueB - valueA;
  });

  if (loading) {
    return (
      <NeonCard className="p-6 text-center">
        <p className="text-slate-400">Loading holdings...</p>
      </NeonCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedInvestments.map((inv) => {
        if (!inv.instrument) return null;

        const typeInfo = INVESTMENT_TYPES[inv.instrument.assetType] || INVESTMENT_TYPES.other;
        const quote = quotes[inv.instrumentId];
        const currentPrice = quote?.price || inv.lastQuotePrice_asset || inv.avgBuyPrice_asset;
        const invCurrency = inv.investmentCurrency || inv.instrument?.instrumentCurrency || 'USD';
        const fxRate = fxRates[invCurrency] !== undefined ? fxRates[invCurrency] : inv.lastFxRate;
        
        const metrics = calculateInvestmentMetrics(
          inv,
          inv.instrument,
          currentPrice,
          fxRate,
          currency
        );

        const isExpanded = expandedId === inv.id;
        const isStale = quote?.isStale || false;
        const lastUpdate = quote?.timestamp || inv.lastQuoteAt;

        return (
          <NeonCard
            key={inv.id}
            className="overflow-hidden cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : inv.id)}
          >
            {/* Summary */}
            <div className="p-4 flex items-center gap-3">
              <div className={`text-3xl flex-shrink-0 ${typeInfo.color}`}>
                {typeInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold truncate">{inv.instrument.symbol}</p>
                  {isStale && (
                    <span className="text-yellow-400 text-[10px] bg-yellow-400/10 px-1.5 py-0.5 rounded">
                      STALE
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs truncate">{inv.instrument.name}</p>
                <p className="text-slate-500 text-[10px]">
                  {inv.quantity} @ {formatCurrency(inv.avgBuyPrice_asset, inv.investmentCurrency || inv.instrument.instrumentCurrency)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
               {metrics.fxUnavailable ? (
                 <>
                   <p className="text-white font-bold">{formatCurrency(metrics.currentValue_asset, metrics.assetCurrency)}</p>
                   <p className="text-red-400 text-[10px]">FX unavailable</p>
                 </>
               ) : (
                 <>
                   <p className="text-white font-bold">{formatCurrency(metrics.currentValue_base, currency)}</p>
                   {metrics.needsFX && (
                     <p className="text-slate-500 text-[10px]">
                       {formatCurrency(metrics.currentValue_asset, metrics.assetCurrency)}
                     </p>
                   )}
                 </>
               )}
               {metrics.hasData ? (
                 <p className={`text-sm flex items-center gap-1 justify-end ${metrics.gainLoss_base >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {metrics.gainLoss_base >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                   {formatPercent(metrics.gainLossPct)}
                 </p>
               ) : (
                 <p className="text-slate-400 text-xs flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" />
                   No data
                 </p>
               )}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-700 overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {/* Last Update */}
                    {lastUpdate && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>Last updated: {format(new Date(lastUpdate), 'MMM dd, HH:mm:ss')}</span>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span>Invested</span>
                        </div>
                        {metrics.fxUnavailable ? (
                          <>
                            <p className="text-white font-semibold">{formatCurrency(metrics.invested_asset, metrics.assetCurrency)}</p>
                            <p className="text-red-400 text-[10px] mt-1">No {currency} rate</p>
                          </>
                        ) : (
                          <>
                            <p className="text-white font-semibold">{formatCurrency(metrics.invested_base, currency)}</p>
                            {metrics.needsFX && (
                              <p className="text-slate-500 text-[10px] mt-1">
                                {formatCurrency(metrics.invested_asset, metrics.assetCurrency)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Gain/Loss</span>
                        </div>
                        {metrics.hasData ? (
                          <>
                            {metrics.fxUnavailable ? (
                              <>
                                <p className={`font-semibold ${metrics.gainLoss_asset >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(metrics.gainLoss_asset, metrics.assetCurrency)}
                                </p>
                                <p className="text-red-400 text-[10px] mt-1">No {currency} rate</p>
                              </>
                            ) : (
                              <>
                                <p className={`font-semibold ${metrics.gainLoss_base >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(metrics.gainLoss_base, currency)}
                                </p>
                                {metrics.needsFX && (
                                  <p className="text-slate-500 text-[10px] mt-1">
                                    {formatCurrency(metrics.gainLoss_asset, metrics.assetCurrency)}
                                  </p>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-400 text-xs">N/A</p>
                        )}
                      </div>
                    </div>

                    {/* Return Percentage */}
                    {metrics.hasData && (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 text-sm">Return</span>
                          <span className={`text-lg font-bold ${metrics.gainLoss_base >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(metrics.gainLossPct)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                          Calculated in {metrics.assetCurrency}
                        </p>
                      </div>
                    )}

                    {/* FX Rate */}
                    {metrics.needsFX && metrics.hasFXData && (
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">FX Rate ({metrics.assetCurrency} → {currency})</span>
                          <span className="text-white font-mono">{fxRate.toFixed(4)}</span>
                        </div>
                        {inv.lastFxAt && (
                          <p className="text-slate-500 text-[10px] mt-1">
                            Updated: {format(new Date(inv.lastFxAt), 'MMM dd, HH:mm')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Currency Conversion Note */}
                     {metrics.needsFX && metrics.hasFXData && (
                       <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2">
                         <p className="text-cyan-400 text-[10px]">
                           ≈ Converted from {metrics.assetCurrency} at {fxRate.toFixed(4)} {metrics.assetCurrency} = 1 {currency}
                         </p>
                       </div>
                     )}
                     {metrics.fxUnavailable && metrics.needsFX && (
                       <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                         <p className="text-red-400 text-[10px]">
                           Conversion to {currency} unavailable - showing {metrics.assetCurrency} values only
                         </p>
                       </div>
                     )}

                    {/* Purchase Info */}
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Purchased: {format(new Date(inv.purchaseDate), 'MMM dd, yyyy')}</p>
                      {inv.notes && <p className="text-slate-500">Notes: {inv.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <NeonButton
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(inv);
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </NeonButton>
                      <NeonButton
                        size="sm"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this investment?')) {
                            onDelete(inv.id);
                          }
                        }}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </NeonButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </NeonCard>
        );
      })}
    </div>
  );
}