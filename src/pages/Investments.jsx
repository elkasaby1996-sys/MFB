import React, { useState, useEffect } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PaywallGate from '@/components/subscription/PaywallGate';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, Wallet, BarChart3, Target, Sparkles, RefreshCw } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "sonner";
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider';
import RequireOnline from '@/components/providers/RequireOnline';
import { usePremium } from '@/components/providers/PremiumProvider';
import QueryWrapper from '@/components/ui/QueryWrapper';
import PortfolioDiversification from '@/components/investments/PortfolioDiversification';
import BenchmarkComparison from '@/components/investments/BenchmarkComparison';
import HistoricalPerformance from '@/components/investments/HistoricalPerformance';
import AIPortfolioInsights from '@/components/investments/AIPortfolioInsights';
import HoldingsList from '@/components/investments/HoldingsList';
import AddInvestmentModal from '@/components/investments/AddInvestmentModal';
import { formatCurrency as formatCurrencyUtil } from '@/components/investments/investmentCalculations';

const INVESTMENT_TYPES = [
  { value: 'stock', label: 'Stocks', icon: '📈' },
  { value: 'crypto', label: 'Crypto', icon: '🪙' },
  { value: 'etf', label: 'ETFs', icon: '📊' },
  { value: 'bond', label: 'Bonds', icon: '📜' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '💼' },
];

const SECTORS = [
  'technology', 'healthcare', 'finance', 'energy', 'consumer', 
  'industrial', 'real_estate', 'utilities', 'materials', 'telecom', 'other'
];

const GEOGRAPHIES = ['us', 'europe', 'asia', 'emerging', 'global', 'other'];

export default function Investments() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { isElite } = usePremium();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: investments = [], isLoading: investmentsLoading, error: investmentsError } = useQuery({
    queryKey: ['investments'],
    enabled: isElite,
    queryFn: async () => {
      try {
        const invs = await base44.entities.Investment.list('-created_date');
        
        // Fetch instruments for each investment
        const withInstruments = await Promise.all(
          invs.map(async (inv) => {
            try {
              if (!inv.instrumentId) {
                console.warn('Investment missing instrumentId:', inv);
                return null;
              }
              const instrument = await base44.entities.Instrument.get(inv.instrumentId);
              if (!instrument) {
                console.warn('Instrument not found:', inv.instrumentId);
                return null;
              }
              return { ...inv, instrument };
            } catch (error) {
              console.error('Failed to fetch instrument:', error);
              return null;
            }
          })
        );
        
        // Filter out null entries
        return withInstruments.filter(inv => inv !== null);
      } catch (error) {
        console.error('Failed to fetch investments:', error);
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Investment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['investments']);
      setShowAddModal(false);
      toast.success('Investment added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Investment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['investments']);
      setShowAddModal(false);
      setEditingInvestment(null);
      toast.success('Investment updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Investment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['investments']);
      toast.success('Investment deleted');
    },
  });

  const refreshPrices = async () => {
    if (!isOnline) {
      toast.error("You're offline. Connect to the internet to refresh prices.");
      return;
    }
    
    if (investments.length === 0) {
      toast.info('No investments to update');
      return;
    }

    setRefreshing(true);
    toast.info('Refreshing prices, FX rates & sector data...');
    
    try {
      // First, backfill missing sector data for equities
      try {
        await base44.functions.invoke('market_fillSectorMetadata', { limit: 50 });
      } catch (error) {
        console.warn('Sector backfill skipped:', error);
      }

      // Batch fetch quotes and FX rates
      const instrumentIds = investments.map(inv => inv.instrumentId);
      const quotesResponse = await base44.functions.invoke('market_batchQuotes', { instrumentIds });
      const quotes = quotesResponse.data.quotes;
      
      // Update each investment
      let updated = 0;
      for (let i = 0; i < investments.length; i++) {
        const inv = investments[i];
        const quote = quotes[i];
        
        if (!quote || quote.error) continue;
        
        // Fetch FX rate (from investment currency to base currency)
        let fxRate = 1;
        const invCurrency = inv.investmentCurrency || inv.instrument?.instrumentCurrency;
        if (invCurrency !== currency) {
          try {
            const fxResponse = await base44.functions.invoke('fx_getRate', {
              from: invCurrency,
              to: currency,
            });
            fxRate = fxResponse.data.rate;
          } catch (error) {
            console.error('FX fetch failed:', error);
            fxRate = inv.lastFxRate || null;
          }
        }
        
        await base44.entities.Investment.update(inv.id, {
          lastQuotePrice_asset: quote.price,
          lastQuoteAt: quote.timestamp,
          lastFxRate: fxRate,
          lastFxAt: new Date().toISOString(),
        });
        updated++;
      }
      
      queryClient.invalidateQueries(['investments']);
      toast.success(`Updated ${updated} investment${updated !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh prices');
    }
    
    setRefreshing(false);
  };

  const handleSubmit = (data) => {
    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const currency = profile?.currency || 'USD';
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    return formatCurrencyUtil(amount, currency, 0);
  };

  // Fetch FX rates for portfolio calculation
  const [portfolioFxRates, setPortfolioFxRates] = useState({});

  useEffect(() => {
    fetchPortfolioFxRates();
  }, [investments, currency]);

  const fetchPortfolioFxRates = async () => {
    if (investments.length === 0) return;

    try {
      // Fetch all rates for base currency in one batch call
      const fxResponse = await base44.functions.invoke('fx_getRatesForBase', {
        baseCurrency: currency,
      });
      
      const rates = fxResponse.data.rates || {};
      const fxMap = {};
      const unavailableCurrencies = [];
      
      const uniqueCurrencies = [...new Set(
        investments.map(inv => inv.investmentCurrency || inv.instrument?.instrumentCurrency).filter(Boolean)
      )];

      uniqueCurrencies.forEach(invCurrency => {
        if (invCurrency === currency) {
          fxMap[invCurrency] = 1;
          return;
        }

        if (rates[invCurrency] !== null && rates[invCurrency] !== undefined) {
          fxMap[invCurrency] = rates[invCurrency];
        } else {
          // Rate unavailable - try stored rate as fallback
          const inv = investments.find(i => (i.investmentCurrency || i.instrument?.instrumentCurrency) === invCurrency);
          if (inv?.lastFxRate) {
            fxMap[invCurrency] = inv.lastFxRate;
            console.warn(`Using stale FX rate for ${invCurrency}`);
          } else {
            fxMap[invCurrency] = null;
            unavailableCurrencies.push(invCurrency);
          }
        }
      });

      setPortfolioFxRates(fxMap);
      
      if (unavailableCurrencies.length > 0) {
        console.warn(`FX rates unavailable for: ${unavailableCurrencies.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to fetch FX rates:', error);
      // Fallback: try individual rates (slower)
      const fxMap = {};
      const uniqueCurrencies = [...new Set(
        investments.map(inv => inv.investmentCurrency || inv.instrument?.instrumentCurrency).filter(Boolean)
      )];

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
            const inv = investments.find(i => (i.investmentCurrency || i.instrument?.instrumentCurrency) === invCurrency);
            fxMap[invCurrency] = inv?.lastFxRate || null;
          }
        } catch (err) {
          console.error(`Failed to fetch FX rate for ${invCurrency}:`, err);
          const inv = investments.find(i => (i.investmentCurrency || i.instrument?.instrumentCurrency) === invCurrency);
          fxMap[invCurrency] = inv?.lastFxRate || null;
        }
      }));

      setPortfolioFxRates(fxMap);
    }
  };

  // Calculate portfolio metrics manually
  const calculatePortfolio = () => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let missingFxCount = 0;
    let investmentsWithConversion = 0;
    
    investments.forEach(inv => {
      if (!inv.instrument) return;
      
      const quantity = parseFloat(inv.quantity) || 0;
      const avgBuy = parseFloat(inv.avgBuyPrice_asset) || 0;
      const currentPrice = parseFloat(inv.lastQuotePrice_asset) || avgBuy;
      const invCurrency = inv.investmentCurrency || inv.instrument?.instrumentCurrency || 'USD';
      const fxRate = portfolioFxRates[invCurrency];

      // If FX rate is null, skip this investment for base currency totals
      if (invCurrency !== currency && fxRate === null) {
        missingFxCount++;
        return; // Don't add to totals if conversion unavailable
      }
      
      // Use fx=1 only if currencies match
      const effectiveFxRate = (invCurrency === currency) ? 1 : (fxRate || 1);
      
      // Calculate in asset currency first
      const invested_asset = quantity * avgBuy;
      const currentValue_asset = quantity * currentPrice;
      
      // Convert to base currency
      totalInvested += invested_asset * effectiveFxRate;
      totalCurrentValue += currentValue_asset * effectiveFxRate;
      investmentsWithConversion++;
    });
    
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    
    return { 
      totalInvested, 
      totalCurrentValue, 
      totalGainLoss, 
      totalGainLossPercent, 
      missingFxCount,
      investmentsWithConversion
    };
  };

  const { totalInvested, totalCurrentValue, totalGainLoss, totalGainLossPercent, missingFxCount, investmentsWithConversion } = calculatePortfolio();

  return (
    <SpaceBackground>
      <SubPageHeader title="Investments" />
      <PaywallGate featureId="investment_tracking" requiredTier="elite">
      <main className="pb-24 px-4 sm:px-6">
        <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4">
          
          {/* Portfolio Summary */}
          <NeonCard className="p-4 sm:p-5" glowColor={totalGainLoss >= 0 ? "green" : "pink"}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-purple-500/20 flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-sm">Portfolio Value</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(totalCurrentValue)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Total Invested</p>
                <p className="text-white font-semibold text-sm sm:text-base">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Total Return</p>
                <p className={`font-semibold flex items-center gap-1 text-sm sm:text-base ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalGainLoss >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)} ({totalGainLossPercent >= 0 ? '+' : ''}{(totalGainLossPercent || 0).toFixed(2)}%)
                </p>
              </div>
            </div>

            {missingFxCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mt-3">
                <p className="text-red-400 text-[10px]">
                  ⚠️ Conversion to {currency} unavailable for {missingFxCount} investment{missingFxCount > 1 ? 's' : ''} - showing {investmentsWithConversion} convertible
                </p>
              </div>
            )}

            <p className="text-slate-500 text-[10px] mt-2">
              All values displayed in {currency}
            </p>
          </NeonCard>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <NeonButton 
              onClick={() => { setEditingInvestment(null); setShowAddModal(true); }} 
              className="flex-1" 
              variant="purple"
            >
              <Plus className="w-5 h-5" />
              Add Investment
            </NeonButton>
            <NeonButton 
              onClick={refreshPrices}
              loading={refreshing}
              disabled={!isOnline || investments.length === 0 || refreshing}
              className="flex-1" 
              variant="secondary"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {!isOnline ? 'Offline' : 'Refresh Prices'}
            </NeonButton>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="holdings">
                <Wallet className="w-4 h-4" />
                <span>Holdings</span>
              </TabsTrigger>
              <TabsTrigger value="performance">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Performance</span>
                <span className="sm:hidden">Perf.</span>
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Sparkles className="w-4 h-4" />
                <span>AI</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <PortfolioDiversification investments={investments} currency={currency} fxRates={portfolioFxRates} />
            </TabsContent>

            <TabsContent value="holdings" className="mt-4">
              <QueryWrapper
                isLoading={investmentsLoading}
                error={investmentsError}
                data={investments}
                emptyMessage="No investments yet. Add your first investment!"
              >
                <HoldingsList 
                  investments={investments}
                  currency={currency}
                  onEdit={(investment) => {
                    setEditingInvestment(investment);
                    setShowAddModal(true);
                  }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              </QueryWrapper>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <HistoricalPerformance investments={investments} currency={currency} />
              <BenchmarkComparison investments={investments} timeframe="1Y" />
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <AIPortfolioInsights investments={investments} currency={currency} />
            </TabsContent>
          </Tabs>
          </div>
          </main>
          </PaywallGate>

      {/* Add/Edit Modal */}
      <AddInvestmentModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingInvestment(null);
        }}
        onSubmit={handleSubmit}
        editingInvestment={editingInvestment}
        loading={createMutation.isPending || updateMutation.isPending}
        baseCurrency={currency}
      />

      <BottomNav currentPage="Investments" />
    </SpaceBackground>
  );
}