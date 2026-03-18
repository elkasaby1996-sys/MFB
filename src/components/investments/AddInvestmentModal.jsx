import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MobileFormSheet from '@/components/ui/MobileFormSheet';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import MobileSelect from '@/components/ui/MobileSelect';
import NeonButton from '@/components/ui/NeonButton';
import InstrumentSearch from './InstrumentSearch';
import { format } from 'date-fns';
import { toast } from "sonner";
import { Loader2, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { calculateInvestmentMetrics, formatCurrency, formatPercent } from './investmentCalculations';

const INVESTMENT_TYPES = [
  { value: 'stock', label: 'Stock', icon: '📈' },
  { value: 'etf', label: 'ETF', icon: '📊' },
  { value: 'crypto', label: 'Crypto', icon: '🪙' },
  { value: 'metal', label: 'Metals', icon: '🥇' },
];

export default function AddInvestmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingInvestment = null,
  loading = false,
  baseCurrency = 'USD'
}) {
  const [formData, setFormData] = useState({
    type: 'stock',
    instrument: null,
    quantity: '',
    avgBuyPrice: '',
    investmentCurrency: 'USD',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [fetchingFX, setFetchingFX] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [fxRate, setFxRate] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingInvestment && editingInvestment.instrument) {
      setFormData({
        type: editingInvestment.instrument.assetType,
        instrument: editingInvestment.instrument,
        quantity: editingInvestment.quantity?.toString() || '',
        avgBuyPrice: editingInvestment.avgBuyPrice_asset?.toString() || '',
        investmentCurrency: editingInvestment.investmentCurrency || editingInvestment.instrument.instrumentCurrency || 'USD',
        purchaseDate: editingInvestment.purchaseDate || format(new Date(), 'yyyy-MM-dd'),
        notes: editingInvestment.notes || '',
      });
    }
  }, [editingInvestment]);

  useEffect(() => {
    // Update investment currency when instrument changes
    if (formData.instrument?.instrumentCurrency && !editingInvestment) {
      setFormData(prev => ({ ...prev, investmentCurrency: formData.instrument.instrumentCurrency }));
    }
  }, [formData.instrument]);

  useEffect(() => {
    if (formData.instrument?.id) {
      fetchLiveQuote();
      fetchFXRate();
    }
  }, [formData.instrument]);

  const fetchLiveQuote = async () => {
    if (!formData.instrument?.id) return;

    setFetchingQuote(true);
    try {
      const response = await base44.functions.invoke('market_getQuote', {
        instrumentId: formData.instrument.id,
      });
      setCurrentQuote(response.data);
    } catch (error) {
      console.error('Quote fetch error:', error);
      setCurrentQuote(null);
    }
    setFetchingQuote(false);
  };

  const fetchFXRate = async () => {
    if (!formData.investmentCurrency) return;

    if (formData.investmentCurrency === baseCurrency) {
      setFxRate({ rate: 1, timestamp: new Date().toISOString(), source: 'same currency' });
      return;
    }

    setFetchingFX(true);
    try {
      const response = await base44.functions.invoke('fx_getRate', {
        from: formData.investmentCurrency,
        to: baseCurrency,
      });
      setFxRate(response.data);
    } catch (error) {
      console.error('FX fetch error:', error);
      setFxRate(null);
    }
    setFetchingFX(false);
  };

  useEffect(() => {
    fetchFXRate();
  }, [formData.investmentCurrency]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.instrument) {
      newErrors.instrument = 'Please select an instrument';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be positive';
    }
    if (!formData.avgBuyPrice || parseFloat(formData.avgBuyPrice) <= 0) {
      newErrors.avgBuyPrice = 'Average price must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors');
      return;
    }

    const data = {
      instrumentId: formData.instrument.id,
      quantity: parseFloat(formData.quantity),
      avgBuyPrice_asset: parseFloat(formData.avgBuyPrice),
      investmentCurrency: formData.investmentCurrency,
      purchaseDate: formData.purchaseDate,
      notes: formData.notes || undefined,
      lastQuotePrice_asset: currentQuote?.price || parseFloat(formData.avgBuyPrice),
      lastQuoteAt: currentQuote?.timestamp || new Date().toISOString(),
      lastFxRate: fxRate?.rate !== null && fxRate?.rate !== undefined ? fxRate.rate : null,
      lastFxAt: fxRate?.timestamp || new Date().toISOString(),
    };

    onSubmit(data);
  };

  const resetForm = () => {
    setFormData({
      type: 'stock',
      instrument: null,
      quantity: '',
      avgBuyPrice: '',
      investmentCurrency: 'USD',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setCurrentQuote(null);
    setFxRate(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculate preview
  const metrics = formData.instrument && formData.quantity && formData.avgBuyPrice && currentQuote
    ? calculateInvestmentMetrics(
        { quantity: parseFloat(formData.quantity), avgBuyPrice_asset: parseFloat(formData.avgBuyPrice), investmentCurrency: formData.investmentCurrency },
        formData.instrument,
        currentQuote.price,
        fxRate?.rate !== null && fxRate?.rate !== undefined ? fxRate.rate : null,
        baseCurrency
      )
    : null;

  return (
    <MobileFormSheet
      open={isOpen}
      onOpenChange={handleClose}
      title={editingInvestment ? 'Edit Investment' : 'Add Investment'}
      footer={
        <NeonButton 
          onClick={handleSubmit}
          loading={loading}
          disabled={!formData.instrument || loading}
          className="w-full min-h-[52px] text-base font-semibold"
          variant="purple"
        >
          {editingInvestment ? 'Update' : 'Add'} Investment
        </NeonButton>
      }
    >
      <div className="space-y-5">
        {/* Asset Type */}
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium">Asset Type</Label>
          <MobileSelect
            value={formData.type}
            onValueChange={(v) => {
              setFormData(prev => ({ ...prev, type: v, instrument: null }));
              setCurrentQuote(null);
              setFxRate(null);
            }}
            options={INVESTMENT_TYPES.map(t => ({ value: t.value, label: t.label, icon: t.icon }))}
            title="Select Asset Type"
          />
        </div>

        {/* Instrument Search - PRIMARY FIELD */}
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium">Search Instrument</Label>
          <InstrumentSearch
            assetType={formData.type}
            selectedInstrument={formData.instrument}
            onSelect={(instrument) => setFormData(prev => ({ ...prev, instrument }))}
          />
          {errors.instrument && (
            <p className="text-red-400 text-xs flex items-center gap-1 mt-1.5">
              <AlertCircle className="w-3 h-3" />
              {errors.instrument}
            </p>
          )}
        </div>

        {/* Investment Details Group */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-700" />
            <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">Investment Details</p>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">Quantity</Label>
            <Input
              type="number"
              inputMode="decimal"
              step={formData.type === 'crypto' || formData.type === 'metal' ? '0.00000001' : '1'}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder={formData.type === 'crypto' ? '0.5' : '10'}
              className="bg-slate-800 border-slate-700 text-white h-14"
            />
            {errors.quantity && (
              <p className="text-red-400 text-xs flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3 h-3" />
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Investment Currency */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">Investment Currency</Label>
            <MobileSelect
              value={formData.investmentCurrency}
              onValueChange={(v) => setFormData(prev => ({ ...prev, investmentCurrency: v }))}
              options={[
                { value: 'USD', label: 'USD', icon: '🇺🇸' },
                { value: 'EUR', label: 'EUR', icon: '🇪🇺' },
                { value: 'GBP', label: 'GBP', icon: '🇬🇧' },
                { value: 'QAR', label: 'QAR', icon: '🇶🇦' },
                { value: 'SAR', label: 'SAR', icon: '🇸🇦' },
                { value: 'AED', label: 'AED', icon: '🇦🇪' },
                { value: 'EGP', label: 'EGP', icon: '🇪🇬' },
              ]}
              title="Investment Currency"
            />
            <p className="text-slate-500 text-xs">Prices are entered in this currency</p>
          </div>

          {/* Average Buy Price */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">Average Buy Price</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={formData.avgBuyPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, avgBuyPrice: e.target.value }))}
              placeholder="150.00"
              className="bg-slate-800 border-slate-700 text-white h-14"
            />
            {errors.avgBuyPrice && (
              <p className="text-red-400 text-xs flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3 h-3" />
                {errors.avgBuyPrice}
              </p>
            )}
          </div>
        </div>

          {/* Live Quote */}
          {currentQuote && (
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">Current Market Price</p>
                {fetchingQuote ? (
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                ) : currentQuote.isStale && (
                  <span className="text-yellow-400 text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Stale
                  </span>
                )}
              </div>
              <p className="text-cyan-400 font-bold text-lg">
                {formatCurrency(currentQuote.price, currentQuote.currency)}
              </p>
              <p className="text-slate-500 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Price updated: {format(new Date(currentQuote.timestamp), 'MMM dd, HH:mm:ss')}
              </p>

              {/* FX Rate Info */}
              {formData.investmentCurrency !== baseCurrency && (
                fxRate?.rate !== null && fxRate?.rate !== undefined ? (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2">
                    <p className="text-cyan-400 text-[10px]">
                      FX: 1 {formData.investmentCurrency} = {fxRate.rate.toFixed(4)} {baseCurrency}
                    </p>
                    {fxRate.timestamp && (
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        FX updated: {format(new Date(fxRate.timestamp), 'MMM dd, HH:mm')} ({fxRate.source})
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                    <p className="text-red-400 text-[10px]">
                      ⚠️ FX rate unavailable for {formData.investmentCurrency} → {baseCurrency}
                    </p>
                    <p className="text-red-400/70 text-[10px] mt-1">
                      Your investment will be displayed in {formData.investmentCurrency} only until rate is available.
                    </p>
                  </div>
                )
              )}

              {/* Preview P/L */}
              {metrics && (
                <div className="pt-2 border-t border-slate-700 space-y-1">
                  <p className="text-slate-400 text-xs">Unrealized P/L Preview</p>
                  {metrics.fxUnavailable ? (
                    <>
                      <p className={`font-bold ${metrics.gainLoss_asset >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(metrics.gainLoss_asset, metrics.assetCurrency)} ({formatPercent(metrics.gainLossPct)})
                      </p>
                      <p className="text-red-400 text-[10px]">
                        No {baseCurrency} rate - showing {metrics.assetCurrency} only
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`font-bold ${metrics.gainLoss_base >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(metrics.gainLoss_base, baseCurrency)} ({formatPercent(metrics.gainLossPct)})
                      </p>
                      {metrics.needsFX && (
                        <p className="text-slate-500 text-[10px]">
                          ≈ {formatCurrency(metrics.gainLoss_asset, metrics.assetCurrency)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Purchase Date */}
        <div className="space-y-2 pt-2">
          <Label className="text-slate-300 text-sm font-medium">Purchase Date</Label>
          <MobileDatePicker
            value={formData.purchaseDate}
            onChange={(date) => setFormData(prev => ({ ...prev, purchaseDate: date }))}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">Notes (Optional)</Label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g., Long-term hold, retirement portfolio"
            className="bg-slate-800 border-slate-700 text-white h-14"
          />
        </div>

        {/* Disclaimer - Visually separated */}
        <div className="bg-slate-800/30 rounded-lg px-3 py-2.5 mt-4">
          <p className="text-slate-500 text-[10px] leading-relaxed">
            📊 Real-time data from Finnhub. Prices may be delayed. Not financial advice.
          </p>
        </div>

        {/* Extra spacing for keyboard safety */}
        <div className="h-4" />
      </div>
    </MobileFormSheet>
  );
}