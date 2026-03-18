import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import CurrencySelector from '../currency/CurrencySelector';
import { CURRENCIES } from '@/components/constants/currencies';
import { Globe, Home, MapPin, Plus, X } from "lucide-react";

export default function CurrencyExpatSettings({ profile, onUpdate }) {
  const [expatMode, setExpatMode] = useState(profile?.expat_mode || false);
  const [baseCurrency, setBaseCurrency] = useState(profile?.currency || 'USD');
  const [activeCurrencies, setActiveCurrencies] = useState(profile?.active_currencies || [profile?.currency || 'USD']);
  const [currentCountry, setCurrentCountry] = useState(profile?.current_country || '');
  const [currentCurrency, setCurrentCurrency] = useState(profile?.current_currency || '');
  const [homeCountry, setHomeCountry] = useState(profile?.home_country || '');
  const [homeCurrency, setHomeCurrency] = useState(profile?.home_currency || '');
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');

  const handleSave = () => {
    onUpdate({
      currency: baseCurrency,
      active_currencies: activeCurrencies,
      expat_mode: expatMode,
      current_country: expatMode ? currentCountry : '',
      current_currency: expatMode ? currentCurrency : '',
      home_country: expatMode ? homeCountry : '',
      home_currency: expatMode ? homeCurrency : '',
    });
  };

  const handleAddCurrency = () => {
    if (newCurrency && !activeCurrencies.includes(newCurrency)) {
      setActiveCurrencies([...activeCurrencies, newCurrency]);
      setShowAddCurrency(false);
      setNewCurrency('');
    }
  };

  const handleRemoveCurrency = (currency) => {
    if (currency !== baseCurrency) {
      setActiveCurrencies(activeCurrencies.filter(c => c !== currency));
    }
  };

  return (
    <div className="space-y-4">
      <NeonCard className="p-5" glowColor="cyan">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-cyan-400" />
          <h3 className="text-white font-semibold text-lg">Currency Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 mb-2 block">Base Currency (Main Reporting)</Label>
            <CurrencySelector 
              value={baseCurrency}
              onChange={setBaseCurrency}
            />
            <p className="text-slate-500 text-xs mt-1">
              All totals and reports will be shown in this currency
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300">Active Currencies</Label>
              <button
                onClick={() => setShowAddCurrency(true)}
                className="text-cyan-400 text-sm flex items-center gap-1 hover:text-cyan-300"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCurrencies.map(curr => {
                const info = CURRENCIES.find(c => c.code === curr);
                return (
                  <div key={curr} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                    <span>{info?.flag}</span>
                    <span className="text-white text-sm">{curr}</span>
                    {curr !== baseCurrency && (
                      <button
                        onClick={() => handleRemoveCurrency(curr)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {showAddCurrency && (
              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <CurrencySelector 
                    value={newCurrency}
                    onChange={setNewCurrency}
                    currencies={CURRENCIES.filter(c => !activeCurrencies.includes(c.code))}
                  />
                </div>
                <NeonButton size="sm" onClick={handleAddCurrency}>
                  Add
                </NeonButton>
                <NeonButton size="sm" variant="ghost" onClick={() => setShowAddCurrency(false)}>
                  Cancel
                </NeonButton>
              </div>
            )}
          </div>
        </div>
      </NeonCard>

      <NeonCard className="p-5" glowColor="green">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Expat Mode</h3>
            <p className="text-slate-400 text-sm">Track home & current country finances separately</p>
          </div>
          <Switch
            checked={expatMode}
            onCheckedChange={setExpatMode}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {expatMode && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <Label className="text-slate-300">Current Country</Label>
                </div>
                <input
                  type="text"
                  value={currentCountry}
                  onChange={(e) => setCurrentCountry(e.target.value)}
                  placeholder="e.g., Qatar"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white min-h-[56px] text-base"
                />
                <div className="mt-2">
                  <CurrencySelector 
                    value={currentCurrency}
                    onChange={setCurrentCurrency}
                    currencies={CURRENCIES}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-green-400" />
                  <Label className="text-slate-300">Home Country</Label>
                </div>
                <input
                  type="text"
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value)}
                  placeholder="e.g., Egypt"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white min-h-[56px] text-base"
                />
                <div className="mt-2">
                  <CurrencySelector 
                    value={homeCurrency}
                    onChange={setHomeCurrency}
                    currencies={CURRENCIES}
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
              <p className="text-green-400 text-xs">
                💚 Expat Mode enables remittance tracking, dual-currency balance views, and country-specific expense filtering
              </p>
            </div>
          </div>
        )}
      </NeonCard>

      <NeonButton onClick={handleSave} className="w-full" variant="purple">
        Save Currency Settings
      </NeonButton>
    </div>
  );
}