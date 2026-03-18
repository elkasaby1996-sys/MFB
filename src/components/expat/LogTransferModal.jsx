import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from '@/components/ui/MobileSelect';
import { Switch } from "@/components/ui/switch";
import NeonButton from '@/components/ui/NeonButton';
import { Loader2, ArrowRight, AlertCircle, Info } from "lucide-react";
import { toast } from 'sonner';
import { formatMoneyWithCode, GRC, getADC, getFxRate } from '@/components/currency/currencyHierarchy';

const COUNTRIES = {
  QA: { name: 'Qatar', currency: 'QAR', flag: '🇶🇦' },
  EG: { name: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
  US: { name: 'United States', currency: 'USD', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  SA: { name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  AE: { name: 'UAE', currency: 'AED', flag: '🇦🇪' },
  IN: { name: 'India', currency: 'INR', flag: '🇮🇳' },
  PK: { name: 'Pakistan', currency: 'PKR', flag: '🇵🇰' },
  BD: { name: 'Bangladesh', currency: 'BDT', flag: '🇧🇩' },
  PH: { name: 'Philippines', currency: 'PHP', flag: '🇵🇭' },
};

export default function LogTransferModal({ isOpen, onClose, defaultFromCountry, defaultToCountry, profile }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fromCountryCode: defaultFromCountry || '',
    toCountryCode: defaultToCountry || '',
    date: new Date().toISOString().split('T')[0],
    purpose: 'family_support',
    recipientDescription: '',
    sentAmount: '',
    sentCurrency: '',
    receivedAmount: '',
    receivedCurrency: '',
    feeAmount: '',
    feeCurrency: '',
    sourceLabel: '',
    destinationLabel: '',
    countAsSpending: false,
    bridgeEnabled: false,
  });

  const [fxData, setFxData] = useState({
    apiRate: null,
    effectiveRate: null,
    bridgeData: null,
    isLoading: false,
    error: null,
  });

  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

  // Query label history
  const { data: labelHistory = [] } = useQuery({
    queryKey: ['transferLabelHistory'],
    queryFn: () => base44.entities.TransferLabelHistory.list('-lastUsedAt'),
  });

  // Update currencies when countries change
  useEffect(() => {
    if (formData.fromCountryCode) {
      const fromCurrency = COUNTRIES[formData.fromCountryCode]?.currency;
      setFormData(prev => ({ ...prev, sentCurrency: fromCurrency, feeCurrency: fromCurrency }));
    }
  }, [formData.fromCountryCode]);

  useEffect(() => {
    if (formData.toCountryCode) {
      const toCurrency = COUNTRIES[formData.toCountryCode]?.currency;
      setFormData(prev => ({ ...prev, receivedCurrency: toCurrency }));
    }
  }, [formData.toCountryCode]);

  // Update label suggestions
  useEffect(() => {
    if (formData.fromCountryCode) {
      const suggestions = labelHistory
        .filter(h => h.direction === 'source' && h.countryCode === formData.fromCountryCode)
        .sort((a, b) => b.useCount - a.useCount || new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
        .slice(0, 5);
      setSourceSuggestions(suggestions);
    }
  }, [formData.fromCountryCode, labelHistory]);

  useEffect(() => {
    if (formData.toCountryCode) {
      const suggestions = labelHistory
        .filter(h => h.direction === 'destination' && h.countryCode === formData.toCountryCode)
        .sort((a, b) => b.useCount - a.useCount || new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
        .slice(0, 5);
      setDestSuggestions(suggestions);
    }
  }, [formData.toCountryCode, labelHistory]);

  // Fetch FX rate when amounts/currencies/date change
  useEffect(() => {
    const fetchFxRate = async () => {
      if (!formData.sentAmount || !formData.sentCurrency || !formData.receivedCurrency || !formData.date) return;

      setFxData(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        if (formData.bridgeEnabled) {
          // USD bridge mode
          const { data: bridge } = await base44.functions.invoke('fx_getUsdBridge', {
            fromCurrency: formData.sentCurrency,
            toCurrency: formData.receivedCurrency,
            date: formData.date,
          });

          const receivedAmt = parseFloat(formData.sentAmount) * bridge.combinedRate;
          const effectiveRate = bridge.combinedRate;

          setFormData(prev => ({ ...prev, receivedAmount: receivedAmt.toFixed(2) }));
          setFxData({
            apiRate: bridge.combinedRate,
            effectiveRate,
            bridgeData: bridge,
            isLoading: false,
            error: null,
          });
        } else {
          // Direct FX
          const { data: rate } = await base44.functions.invoke('fx_getRate', {
            from: formData.sentCurrency,
            to: formData.receivedCurrency,
            date: formData.date,
          });

          const receivedAmt = parseFloat(formData.sentAmount) * rate.rate;
          setFormData(prev => ({ ...prev, receivedAmount: receivedAmt.toFixed(2) }));
          setFxData({
            apiRate: rate.rate,
            effectiveRate: rate.rate,
            bridgeData: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('FX fetch error:', error);
        setFxData(prev => ({ ...prev, isLoading: false, error: 'Failed to fetch exchange rate' }));
      }
    };

    const timer = setTimeout(fetchFxRate, 500);
    return () => clearTimeout(timer);
  }, [formData.sentAmount, formData.sentCurrency, formData.receivedCurrency, formData.date, formData.bridgeEnabled]);

  // Calculate effective rate considering fees
  useEffect(() => {
    if (formData.sentAmount && formData.receivedAmount && formData.feeAmount) {
      const sent = parseFloat(formData.sentAmount);
      const received = parseFloat(formData.receivedAmount);
      const fee = parseFloat(formData.feeAmount) || 0;
      const effectiveRate = received / (sent + fee);
      setFxData(prev => ({ ...prev, effectiveRate }));
    }
  }, [formData.sentAmount, formData.receivedAmount, formData.feeAmount]);

  const createTransferMutation = useMutation({
    mutationFn: async (data) => {
      const adc = getADC(profile);
      
      // Compute USD snapshots for global reporting
      let usdSentAmount = data.sentAmount;
      let usdReceivedAmount = data.receivedAmount;
      
      if (data.sentCurrency !== GRC) {
        const sentConversion = await base44.functions.invoke('fx_getRate', {
          from: data.sentCurrency,
          to: GRC,
          date: data.date,
        });
        usdSentAmount = data.sentAmount * sentConversion.data.rate;
      }
      
      if (data.receivedCurrency !== GRC) {
        const receivedConversion = await base44.functions.invoke('fx_getRate', {
          from: data.receivedCurrency,
          to: GRC,
          date: data.date,
        });
        usdReceivedAmount = data.receivedAmount * receivedConversion.data.rate;
      }
      
      // Create the remittance with snapshots
      const remittance = await base44.entities.Remittance.create({
        ...data,
        usdSentAmount,
        usdReceivedAmount,
      });

      let expenseTransactionId = null;

      // If countAsSpending is enabled, create expense transaction in ADC
      if (data.countAsSpending) {
        let expenseAmount = data.sentAmount;
        let expenseCurrency = data.sentCurrency;
        
        // Convert to ADC if needed
        if (data.sentCurrency !== adc) {
          const conversion = await base44.functions.invoke('fx_getRate', {
            from: data.sentCurrency,
            to: adc,
            date: data.date,
          });
          expenseAmount = data.sentAmount * conversion.data.rate;
          expenseCurrency = adc;
        }
        
        const expenseTransaction = await base44.entities.Transaction.create({
          type: 'expense',
          amount: expenseAmount,
          currency: expenseCurrency,
          date: data.date,
          category: 'Remittance',
          category_icon: '💸',
          merchant: data.recipientDescription || data.destinationLabel || data.purpose,
          notes: 'Expat transfer (analytics only)',
          payment_method: 'bank',
          country_context: 'current',
        });
        expenseTransactionId = expenseTransaction.id;

        // Update remittance with linked expense transaction ID
        await base44.entities.Remittance.update(remittance.id, {
          createdExpenseTransactionId: expenseTransactionId,
        });
      }

      // Upsert label history
      if (data.sourceLabel) {
        await upsertLabelHistory('source', data.fromCountryCode, data.sentCurrency, data.sourceLabel);
      }
      if (data.destinationLabel) {
        await upsertLabelHistory('destination', data.toCountryCode, data.receivedCurrency, data.destinationLabel);
      }

      return remittance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['remittances']);
      queryClient.invalidateQueries(['transferLabelHistory']);
      queryClient.invalidateQueries(['transactions']);
      toast.success('Transfer logged successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to log transfer');
    },
  });

  const upsertLabelHistory = async (direction, countryCode, currency, label) => {
    const existing = labelHistory.find(h => 
      h.direction === direction && h.countryCode === countryCode && h.label === label
    );

    if (existing) {
      await base44.entities.TransferLabelHistory.update(existing.id, {
        lastUsedAt: new Date().toISOString(),
        useCount: existing.useCount + 1,
      });
    } else {
      await base44.entities.TransferLabelHistory.create({
        direction,
        countryCode,
        currency,
        label,
        lastUsedAt: new Date().toISOString(),
        useCount: 1,
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.sentAmount || !formData.receivedAmount || !formData.sourceLabel) {
      toast.error('Please fill required fields');
      return;
    }

    createTransferMutation.mutate({
      ...formData,
      sentAmount: parseFloat(formData.sentAmount),
      receivedAmount: parseFloat(formData.receivedAmount),
      feeAmount: formData.feeAmount ? parseFloat(formData.feeAmount) : null,
      apiRate: fxData.apiRate,
      effectiveRate: fxData.effectiveRate,
      bridgeData: fxData.bridgeData ? JSON.stringify(fxData.bridgeData) : null,
      fxSource: 'ExchangeRate',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
        
        <div className="px-5 pb-3">
          <h3 className="text-white text-lg font-semibold">Log Money Transfer</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-6">
          {/* Countries */}
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm font-medium">From Country</Label>
              <MobileSelect
                value={formData.fromCountryCode}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fromCountryCode: v }))}
                options={Object.entries(COUNTRIES).map(([code, info]) => ({ value: code, label: info.name, icon: info.flag }))}
                placeholder="Select country"
                title="From Country"
                triggerClassName="mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm font-medium">To Country</Label>
              <MobileSelect
                value={formData.toCountryCode}
                onValueChange={(v) => setFormData(prev => ({ ...prev, toCountryCode: v }))}
                options={Object.entries(COUNTRIES).map(([code, info]) => ({ value: code, label: info.name, icon: info.flag }))}
                placeholder="Select country"
                title="To Country"
                triggerClassName="mt-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm font-medium">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white mt-2 h-14"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm font-medium">Purpose</Label>
              <MobileSelect
                value={formData.purpose}
                onValueChange={(v) => setFormData(prev => ({ ...prev, purpose: v }))}
                options={[
                  { value: 'family_support', label: 'Family Support', icon: '👨‍👩‍👧' },
                  { value: 'personal_transfer', label: 'Personal Transfer', icon: '💸' },
                  { value: 'business', label: 'Business', icon: '💼' },
                  { value: 'investment', label: 'Investment', icon: '📈' },
                  { value: 'other', label: 'Other', icon: '📋' },
                ]}
                title="Transfer Purpose"
                triggerClassName="mt-2"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm font-medium">Recipient/Description</Label>
            <Input
              value={formData.recipientDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, recipientDescription: e.target.value }))}
              placeholder="e.g., Family"
              className="bg-slate-800 border-slate-700 text-white mt-2 h-14"
            />
          </div>

          {/* Money Section */}
          <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
            <div className="flex items-start gap-2 mb-3">
              <h3 className="text-white font-semibold flex-1">Transfer Amount</h3>
              <div className="text-slate-400 text-xs max-w-xs">
                <Info className="w-4 h-4 inline mr-1" />
                Values stored in original currency. Conversions use ExchangeRate.
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Sent Amount *</Label>
                <p className="text-xs text-slate-500 mb-1">Original currency</p>
                <div className="space-y-2 mt-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.sentAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, sentAmount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-slate-800 border-slate-700 text-white h-14"
                  />
                  <MobileSelect
                    value={formData.sentCurrency}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, sentCurrency: v }))}
                    options={[
                      { value: 'QAR', label: 'QAR', icon: '🇶🇦' },
                      { value: 'EGP', label: 'EGP', icon: '🇪🇬' },
                      { value: 'USD', label: 'USD', icon: '🇺🇸' },
                      { value: 'SAR', label: 'SAR', icon: '🇸🇦' },
                      { value: 'AED', label: 'AED', icon: '🇦🇪' },
                    ]}
                    title="Sent Currency"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-sm font-medium">Received Amount *</Label>
                <p className="text-xs text-slate-500 mb-1">Estimated (auto)</p>
                <div className="space-y-2 mt-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.receivedAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivedAmount: e.target.value }))}
                    placeholder="Auto-filled"
                    className="bg-slate-800 border-slate-700 text-white h-14"
                  />
                  <MobileSelect
                    value={formData.receivedCurrency}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, receivedCurrency: v }))}
                    options={[
                      { value: 'QAR', label: 'QAR', icon: '🇶🇦' },
                      { value: 'EGP', label: 'EGP', icon: '🇪🇬' },
                      { value: 'USD', label: 'USD', icon: '🇺🇸' },
                      { value: 'SAR', label: 'SAR', icon: '🇸🇦' },
                      { value: 'AED', label: 'AED', icon: '🇦🇪' },
                    ]}
                    title="Received Currency"
                  />
                </div>
              </div>
            </div>

            {/* FX Rate Display */}
            {fxData.isLoading && (
              <div className="flex items-center gap-2 mt-3 text-cyan-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching exchange rate...</span>
              </div>
            )}

            {fxData.apiRate && !fxData.isLoading && (
              <div className="mt-3 text-sm">
                <p className="text-slate-400">
                  API Rate: 1 {formData.sentCurrency} = {fxData.apiRate.toFixed(4)} {formData.receivedCurrency}
                </p>
                {fxData.effectiveRate && fxData.effectiveRate !== fxData.apiRate && (
                  <p className="text-slate-400">
                    Effective Rate (with fees): 1 {formData.sentCurrency} = {fxData.effectiveRate.toFixed(4)} {formData.receivedCurrency}
                  </p>
                )}
              </div>
            )}

            {/* USD Bridge */}
            <div className="flex items-center gap-2 mt-4">
              <Switch
                checked={formData.bridgeEnabled}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, bridgeEnabled: v }))}
              />
              <Label>Advanced: route via USD</Label>
            </div>

            {formData.bridgeEnabled && fxData.bridgeData && (
              <div className="mt-2 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
                <p>{formData.sentCurrency} → USD: {fxData.bridgeData.firstRate?.toFixed(4)}</p>
                <p>USD → {formData.receivedCurrency}: {fxData.bridgeData.secondRate?.toFixed(4)}</p>
                <p>USD Intermediate: ${fxData.bridgeData.usdAmount?.toFixed(2)}</p>
              </div>
            )}

            {/* Fees */}
            <div className="mt-4 space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Fee (optional)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={formData.feeAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, feeAmount: e.target.value }))}
                placeholder="0.00"
                className="bg-slate-800 border-slate-700 text-white h-14"
              />
              <MobileSelect
                value={formData.feeCurrency}
                onValueChange={(v) => setFormData(prev => ({ ...prev, feeCurrency: v }))}
                options={[
                  { value: 'QAR', label: 'QAR', icon: '🇶🇦' },
                  { value: 'EGP', label: 'EGP', icon: '🇪🇬' },
                  { value: 'USD', label: 'USD', icon: '🇺🇸' },
                ]}
                title="Fee Currency"
              />
            </div>
          </div>

          {/* Account Labels */}
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm font-medium">From (account label) *</Label>
              <Input
                value={formData.sourceLabel}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceLabel: e.target.value }))}
                placeholder="e.g., QNB Savings, Wallet"
                className="bg-slate-800 border-slate-700 text-white mt-2 h-14"
              />
              {sourceSuggestions.length > 0 && !formData.sourceLabel && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {sourceSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setFormData(prev => ({ ...prev, sourceLabel: s.label }))}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 min-h-[44px] active:bg-slate-600"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-slate-300 text-sm font-medium">To (account label)</Label>
              <Input
                value={formData.destinationLabel}
                onChange={(e) => setFormData(prev => ({ ...prev, destinationLabel: e.target.value }))}
                placeholder="e.g., Family Account, Home"
                className="bg-slate-800 border-slate-700 text-white mt-2 h-14"
              />
              {destSuggestions.length > 0 && !formData.destinationLabel && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {destSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setFormData(prev => ({ ...prev, destinationLabel: s.label }))}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 min-h-[44px] active:bg-slate-600"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analytics Option */}
          <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.countAsSpending}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, countAsSpending: v }))}
              />
              <Label>Count as spending in current country (analytics only)</Label>
            </div>
            {formData.countAsSpending && (
              <p className="text-xs text-slate-400 pl-10">
                Creates an expense in your app currency ({getADC(profile)}) for spending analytics.
              </p>
            )}
          </div>

          {fxData.error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{fxData.error}</span>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <NeonButton
            onClick={handleSubmit}
            loading={createTransferMutation.isPending}
            disabled={!formData.sentAmount || !formData.receivedAmount || !formData.sourceLabel}
            className="w-full min-h-[52px] text-base font-semibold"
          >
            Log Transfer
          </NeonButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}