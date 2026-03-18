import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Home, Building2, Car, Briefcase, Wallet } from "lucide-react";
import { formatMoney, formatMoneyWithCode, GRC, getADC } from '@/components/currency/currencyHierarchy';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';

const COUNTRIES = {
  QA: { name: 'Qatar', currency: 'QAR', flag: '🇶🇦' },
  EG: { name: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
  US: { name: 'United States', currency: 'USD', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  SA: { name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  AE: { name: 'UAE', currency: 'AED', flag: '🇦🇪' },
  IN: { name: 'India', currency: 'INR', flag: '🇮🇳' },
  PK: { name: 'Pakistan', currency: 'PKR', flag: '🇵🇰' },
};

const ASSET_TYPES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank_balance', label: 'Bank Balance', icon: Building2 },
  { value: 'property', label: 'Property / Real Estate', icon: Home },
  { value: 'vehicle', label: 'Vehicle', icon: Car },
  { value: 'business', label: 'Business Ownership', icon: Briefcase },
  { value: 'other', label: 'Other Asset', icon: Wallet },
];

export default function CountryDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const countryCode = searchParams.get('country') || 'QA';
  
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: '',
    type: 'cash',
    value: '',
    notes: '',
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
  });

  const { data: manualAssets = [] } = useQuery({
    queryKey: ['manualAssets'],
    queryFn: () => base44.entities.ManualAsset.list(),
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.ManualAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['manualAssets']);
      setShowAssetModal(false);
      setAssetForm({ name: '', type: 'cash', value: '', notes: '' });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => base44.entities.ManualAsset.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['manualAssets']),
  });

  const baseCurrency = profile?.currency || 'USD';
  const adc = getADC(profile);
  const country = COUNTRIES[countryCode] || { name: countryCode, currency: 'USD', flag: '🌍' };

  // Filter data for this country by country_code
  const countryAssets = {
    savings: savingsGoals.filter(g => g.country_code === countryCode),
    investments: investments.filter(i => i.country_code === countryCode),
    manual: manualAssets.filter(a => a.country_code === countryCode),
  };

  const countryDebts = debts.filter(d => 
    d.status === 'active' && d.country_code === countryCode
  );

  // Calculate totals
  const totalAssets = 
    countryAssets.savings.reduce((sum, g) => sum + (g.current_amount_base || g.current_amount || 0), 0) +
    countryAssets.investments.reduce((sum, i) => sum + (i.current_value_base || i.current_value || 0), 0) +
    countryAssets.manual.reduce((sum, a) => sum + (a.value_base || a.value || 0), 0);

  const totalLiabilities = countryDebts.reduce((sum, d) => sum + (d.current_balance_base || d.current_balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Income & Expenses
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd && t.country_code === countryCode;
  });

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount_base || t.amount || 0), 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount_base || t.amount || 0), 0);

  const handleAddAsset = () => {
    createAssetMutation.mutate({
      ...assetForm,
      value: parseFloat(assetForm.value),
      currency: country.currency,
      country_code: countryCode,
    });
  };

  return (
    <SpaceBackground>
      <main className="pb-24 px-4 pt-safe">
        <div className="max-w-4xl mx-auto space-y-6 py-4">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(createPageUrl('ExpatHub'))} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <span className="text-4xl">{country.flag}</span>
                {country.name}
              </h1>
              <p className="text-slate-400 text-sm">Local currency: {country.currency}</p>
            </div>
          </div>

          {/* Net Worth Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <NeonCard className="p-6" glowColor="cyan">
              <h2 className="text-white font-semibold mb-4">Net Worth in {country.name}</h2>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-white">
                  {formatMoney(netWorth, GRC, { decimals: 0 })}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Primary currency: {country.currency}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Assets (USD)</p>
                  <p className="text-green-400 font-bold">{formatMoney(totalAssets, GRC, { decimals: 0 })}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Liabilities (USD)</p>
                  <p className="text-red-400 font-bold">{formatMoney(totalLiabilities, GRC, { decimals: 0 })}</p>
                </div>
              </div>
            </NeonCard>
          </motion.div>

          {/* Assets */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <NeonCard className="p-5" glowColor="green">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Assets in {country.name}</h3>
                <NeonButton size="sm" variant="secondary" onClick={() => setShowAssetModal(true)}>
                  <Plus className="w-4 h-4" />
                  Add Asset
                </NeonButton>
              </div>

              <div className="space-y-3">
                {countryAssets.savings.map(g => (
                  <div key={g.id} className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3">
                    <div>
                      <p className="text-white font-medium">{g.name}</p>
                      <p className="text-slate-500 text-xs">Savings Goal</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">
                        {formatMoney(g.current_amount_base || g.current_amount, GRC, { decimals: 0 })}
                      </p>
                      {g.currency !== GRC && (
                        <p className="text-slate-500 text-xs">
                          Original: {formatMoneyWithCode(g.current_amount, g.currency, { decimals: 0 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {countryAssets.investments.map(i => (
                  <div key={i.id} className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3">
                    <div>
                      <p className="text-white font-medium">{i.name}</p>
                      <p className="text-slate-500 text-xs">Investment</p>
                    </div>
                    <p className="text-green-400 font-semibold">
                      {formatCurrency(i.current_value_base || i.current_value, baseCurrency)}
                    </p>
                  </div>
                ))}

                {countryAssets.manual.map(a => {
                  const AssetIcon = ASSET_TYPES.find(t => t.value === a.type)?.icon || Wallet;
                  return (
                    <div key={a.id} className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <AssetIcon className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-white font-medium">{a.name}</p>
                          <p className="text-slate-500 text-xs capitalize">{a.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">
                            {formatMoney(a.value_base || a.value, GRC, { decimals: 0 })}
                          </p>
                          {a.currency !== GRC && (
                            <p className="text-slate-500 text-xs">
                              Original: {formatMoneyWithCode(a.value, a.currency, { decimals: 0 })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteAssetMutation.mutate(a.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {totalAssets === 0 && (
                  <p className="text-slate-400 text-center py-4">No assets tracked yet</p>
                )}
              </div>
            </NeonCard>
          </motion.div>

          {/* Liabilities */}
          {countryDebts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <NeonCard className="p-5" glowColor="pink">
                <h3 className="text-white font-semibold mb-4">Liabilities in {country.name}</h3>
                <div className="space-y-3">
                  {countryDebts.map(d => (
                    <div key={d.id} className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3">
                      <div>
                        <p className="text-white font-medium">{d.name}</p>
                        <p className="text-slate-500 text-xs capitalize">{d.type.replace('_', ' ')}</p>
                      </div>
                      <p className="text-red-400 font-semibold">
                        {formatCurrency(d.current_balance_base || d.current_balance, baseCurrency)}
                      </p>
                    </div>
                  ))}
                </div>
              </NeonCard>
            </motion.div>
          )}

          {/* Income & Expenses */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <NeonCard className="p-5" glowColor="purple">
              <h3 className="text-white font-semibold mb-4">Income & Spending - {format(now, 'MMMM yyyy')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Income (USD)</p>
                  <p className="text-green-400 font-bold">{formatMoney(monthIncome, GRC, { decimals: 0 })}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Expenses (USD)</p>
                  <p className="text-red-400 font-bold">{formatMoney(monthExpenses, GRC, { decimals: 0 })}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Net (USD)</p>
                  <p className={`font-bold ${monthIncome - monthExpenses >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                    {formatMoney(monthIncome - monthExpenses, GRC, { decimals: 0 })}
                  </p>
                </div>
              </div>
            </NeonCard>
          </motion.div>
        </div>
      </main>

      {/* Add Asset Modal */}
      <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Asset in {country.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Asset Name</Label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Apartment in Cairo"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Asset Type</Label>
              <Select value={assetForm.type} onValueChange={(v) => setAssetForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ASSET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Value ({country.currency})</Label>
              <Input
                type="number"
                value={assetForm.value}
                onChange={(e) => setAssetForm(prev => ({ ...prev, value: e.target.value }))}
                placeholder="0"
                className="bg-slate-800 border-slate-700 text-white text-xl h-12 mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Notes (optional)</Label>
              <Input
                value={assetForm.notes}
                onChange={(e) => setAssetForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional details"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <NeonButton 
              onClick={handleAddAsset}
              loading={createAssetMutation.isPending}
              disabled={!assetForm.name || !assetForm.value}
              className="w-full"
            >
              Add Asset
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentPage="ExpatHub" />
    </SpaceBackground>
  );
}