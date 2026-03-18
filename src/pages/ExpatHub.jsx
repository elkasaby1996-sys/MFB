import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import CountryCard from '@/components/expat/CountryCard';
import RemittanceFlows from '@/components/expat/RemittanceFlows';
import LogTransferModal from '@/components/expat/LogTransferModal';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/MobileSelect";
import { Plus, Globe, Settings, Info } from "lucide-react";
import SubPageHeader from '@/components/layout/SubPageHeader';
import PaywallGate from '@/components/subscription/PaywallGate';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatMoney, GRC, getADC } from '@/components/currency/currencyHierarchy';
import { COUNTRIES } from '@/components/constants/countries';
import { usePremium } from '@/components/providers/PremiumProvider';

// Convert COUNTRIES array to object format for this file
const COUNTRIES_MAP = COUNTRIES.reduce((acc, country) => {
  acc[country.code] = { name: country.name, currency: country.currency };
  return acc;
}, {});

export default function ExpatHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isElite } = usePremium();
  const [showRemittanceModal, setShowRemittanceModal] = useState(false);
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [countryForm, setCountryForm] = useState({
    country_code: '',
    role: 'other',
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    enabled: isElite,
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    enabled: isElite,
    queryFn: () => base44.entities.Investment.list(),
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    enabled: isElite,
    queryFn: () => base44.entities.Debt.list(),
  });

  const { data: manualAssets = [] } = useQuery({
    queryKey: ['manualAssets'],
    enabled: isElite,
    queryFn: () => base44.entities.ManualAsset.list(),
  });

  const { data: remittances = [] } = useQuery({
    queryKey: ['remittances'],
    enabled: isElite,
    queryFn: () => base44.entities.Remittance.list('-date'),
  });

  const { data: remittanceGoals = [] } = useQuery({
    queryKey: ['remittanceGoals'],
    enabled: isElite,
    queryFn: () => base44.entities.RemittanceGoal.list(),
  });

  const { data: countryProfiles = [] } = useQuery({
    queryKey: ['countryProfiles'],
    enabled: isElite,
    queryFn: () => base44.entities.CountryProfile.list(),
  });

  const createCountryMutation = useMutation({
    mutationFn: (data) => base44.entities.CountryProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['countryProfiles']);
      setShowAddCountryModal(false);
      setCountryForm({ country_code: '', role: 'other' });
    },
  });

  const deleteCountryMutation = useMutation({
    mutationFn: (id) => base44.entities.CountryProfile.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['countryProfiles']),
  });

  const baseCurrency = profile?.currency || 'USD';
  const adc = getADC(profile);

  // Calculate assets and liabilities by country
  const calculateCountryData = () => {
    const countries = {};

    const addCountry = (code, context, profileId) => {
      if (!code) return;
      if (!countries[code]) {
        countries[code] = {
          code,
          name: COUNTRIES_MAP[code]?.name || code,
          currency: COUNTRIES_MAP[code]?.currency || 'USD',
          context: context,
          profileId: profileId,
          assets: 0,
          liabilities: 0,
        };
      }
    };

    // Add countries from CountryProfile
    countryProfiles.forEach(cp => {
      if (cp.is_active !== false) {
        addCountry(cp.country_code, cp.role, cp.id);
      }
    });

    // Savings goals
    savingsGoals.forEach(g => {
      const code = g.country_code;
      if (code && countries[code]) {
        countries[code].assets += (g.current_amount_base || g.current_amount || 0);
      }
    });

    // Investments
    investments.forEach(i => {
      const code = i.country_code;
      if (code && countries[code]) {
        countries[code].assets += (i.current_value_base || i.current_value || 0);
      }
    });

    // Debts
    debts.forEach(d => {
      const code = d.country_code;
      if (code && countries[code] && d.status === 'active') {
        countries[code].liabilities += (d.current_balance_base || d.current_balance || 0);
      }
    });

    // Manual assets
    manualAssets.forEach(a => {
      const code = a.country_code;
      if (code && countries[code]) {
        countries[code].assets += (a.value_base || a.value || 0);
      }
    });

    return Object.values(countries).sort((a, b) => {
      if (a.context === 'current') return -1;
      if (b.context === 'current') return 1;
      if (a.context === 'home') return -1;
      if (b.context === 'home') return 1;
      return 0;
    });
  };

  const countryData = calculateCountryData();
  const totalAssets = countryData.reduce((sum, c) => sum + c.assets, 0);
  const totalLiabilities = countryData.reduce((sum, c) => sum + c.liabilities, 0);
  const globalNetWorth = totalAssets - totalLiabilities;

  // Get default countries for transfer modal
  const currentCountry = countryProfiles.find(cp => cp.role === 'current');
  const homeCountry = countryProfiles.find(cp => cp.role === 'home');

  const handleAddCountry = () => {
    const country = COUNTRIES_MAP[countryForm.country_code];
    if (!country) return;

    createCountryMutation.mutate({
      country_code: countryForm.country_code,
      country_name: country.name,
      currency: country.currency,
      role: countryForm.role,
    });
  };

  // Check if country already exists
  const existingCountryCodes = countryProfiles.map(cp => cp.country_code);
  const availableCountries = Object.entries(COUNTRIES_MAP).filter(
    ([code]) => !existingCountryCodes.includes(code)
  );

  return (
    <SpaceBackground>
      <SubPageHeader title="Global Money Hub" />
      <PaywallGate featureId="expat_tools" requiredTier="elite">
      <main className="pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6 py-4">

          {/* Global Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <NeonCard className="p-6" glowColor="cyan">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-white font-semibold flex-1">🌍 Global Net Worth (USD)</h2>
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-400" />
                  <div className="hidden group-hover:block absolute right-0 top-full mt-1 p-2 bg-slate-800 text-xs text-slate-300 rounded whitespace-nowrap z-10">
                    All countries converted to USD using ExchangeRate
                  </div>
                </div>
              </div>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-white mb-2">
                  {formatMoney(globalNetWorth, GRC, { decimals: 0 })}
                </p>
                <p className="text-slate-400 text-sm">Across {countryData.length} countr{countryData.length === 1 ? 'y' : 'ies'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Total Assets (USD)</p>
                  <p className="text-green-400 font-bold">
                    {formatMoney(totalAssets, GRC, { decimals: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Total Liabilities (USD)</p>
                  <p className="text-red-400 font-bold">
                    {formatMoney(totalLiabilities, GRC, { decimals: 0 })}
                  </p>
                </div>
              </div>
            </NeonCard>
          </motion.div>

          {/* Remittance Flows */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <RemittanceFlows
              remittances={remittances}
              goals={remittanceGoals}
              baseCurrency={baseCurrency}
              onAddRemittance={() => setShowRemittanceModal(true)}
              onManageGoals={() => navigate(createPageUrl('RemittanceGoals'))}
            />
          </motion.div>

          {/* Country Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Your Countries</h2>
              <NeonButton 
                size="sm" 
                variant="secondary"
                onClick={() => setShowAddCountryModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Country
              </NeonButton>
            </div>
            <div className="space-y-3">
              {countryData.map((country, index) => (
                <motion.div
                  key={country.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <CountryCard
                    countryCode={country.code}
                    countryName={country.name}
                    context={country.context}
                    assets={country.assets}
                    liabilities={country.liabilities}
                    currency={country.currency}
                    baseCurrency={baseCurrency}
                    onDelete={country.profileId ? () => deleteCountryMutation.mutate(country.profileId) : null}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {countryData.length === 0 && (
            <NeonCard className="p-8 text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-white font-semibold mb-2">No Countries Added Yet</h3>
              <p className="text-slate-400 text-sm mb-4">
                Add your first country to start tracking assets and money flows
              </p>
              <NeonButton onClick={() => setShowAddCountryModal(true)}>
                <Plus className="w-4 h-4" />
                Add Country
              </NeonButton>
            </NeonCard>
          )}
        </div>
      </main>

      </PaywallGate>

      {/* Add Country Modal */}
      <Sheet open={showAddCountryModal} onOpenChange={setShowAddCountryModal}>
        <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
          
          <div className="px-5 pb-3">
            <h3 className="text-white text-lg font-semibold">Add Country</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 24px)' }}>
            <div>
              <Label className="text-slate-300">Country</Label>
              <MobileSelect
                value={countryForm.country_code}
                onValueChange={(v) => setCountryForm(prev => ({ ...prev, country_code: v }))}
                options={availableCountries.map(([code, info]) => ({ value: code, label: info.name }))}
                placeholder="Select country"
                title="Select Country"
                triggerClassName="mt-1"
                searchable
              />
            </div>

            <div>
              <Label className="text-slate-300">Role</Label>
              <MobileSelect
                value={countryForm.role}
                onValueChange={(v) => setCountryForm(prev => ({ ...prev, role: v }))}
                options={[
                  { value: 'current', label: 'Current Country (where I live)' },
                  { value: 'home', label: 'Home Country (originally from)' },
                  { value: 'other', label: 'Other Country' }
                ]}
                title="Select Role"
                triggerClassName="mt-1"
              />
            </div>

            <NeonButton 
              onClick={handleAddCountry}
              loading={createCountryMutation.isPending}
              disabled={!countryForm.country_code}
              className="w-full"
            >
              Add Country
            </NeonButton>
          </div>
        </SheetContent>
      </Sheet>

      {/* Transfer Modal */}
      <LogTransferModal
        isOpen={showRemittanceModal}
        onClose={() => setShowRemittanceModal(false)}
        defaultFromCountry={currentCountry?.country_code}
        defaultToCountry={homeCountry?.country_code}
        profile={profile}
      />

      <BottomNav currentPage="ExpatHub" />
    </SpaceBackground>
  );
}