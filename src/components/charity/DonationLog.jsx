import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import IOSPicker from '@/components/ui/IOSPicker';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import CurrencySelector from '../currency/CurrencySelector';
import CountryContextSelector from '../currency/CountryContextSelector';
import { Plus, Heart, EyeOff, Trash2 } from "lucide-react";
import { formatCurrency, formatDualCurrency } from '../currency/currencyUtils';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'charity', label: 'Charity', icon: '💚' },
  { value: 'family_support', label: 'Family Support', icon: '👨‍👩‍👧' },
  { value: 'community', label: 'Community', icon: '🤝' },
  { value: 'religious', label: 'Religious / Zakat', icon: '🕌' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export default function DonationLog({ 
  donations, 
  onAdd, 
  onDelete,
  baseCurrency,
  expatMode,
  fxRates 
}) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: baseCurrency,
    date: format(new Date(), 'yyyy-MM-dd'),
    recipient: '',
    category: 'charity',
    is_zakat: false,
    is_private: false,
    country_context: 'current',
    notes: '',
  });

  const handleSubmit = async () => {
    const amount = parseFloat(formData.amount);
    
    // Calculate FX conversion if needed
    let amountBase = amount;
    let fxRate = 1;
    
    if (formData.currency !== baseCurrency) {
      const converted = await import('../currency/currencyUtils').then(m => 
        m.convertCurrency(amount, formData.currency, baseCurrency, fxRates)
      );
      amountBase = converted.amount;
      fxRate = converted.rate;
    }

    onAdd({
      ...formData,
      amount,
      amount_base: amountBase,
      fx_rate: fxRate,
    });
    
    setShowModal(false);
    setFormData({
      amount: '',
      currency: baseCurrency,
      date: format(new Date(), 'yyyy-MM-dd'),
      recipient: '',
      category: 'charity',
      is_zakat: false,
      is_private: false,
      country_context: 'current',
      notes: '',
    });
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Donation Log</h3>
          <NeonButton onClick={() => setShowModal(true)} size="sm" variant="purple">
            <Plus className="w-4 h-4" />
            Add Donation
          </NeonButton>
        </div>

        {donations.length > 0 ? (
          <div className="space-y-2">
            {donations.map(donation => {
              const category = CATEGORIES.find(c => c.value === donation.category);
              
              return (
                <NeonCard key={donation.id} className="p-4" glowColor="green">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{category?.icon}</span>
                        <p className="text-white font-medium">
                          {donation.is_private ? (
                            <span className="flex items-center gap-1">
                              <EyeOff className="w-4 h-4" />
                              Private Donation
                            </span>
                          ) : (
                            donation.recipient
                          )}
                        </p>
                      </div>
                      <p className="text-slate-400 text-sm">{category?.label}</p>
                      <p className="text-slate-500 text-xs mt-1">
                      {format(new Date(donation.date), 'MMM d, yyyy')}
                      </p>
                      {donation.is_zakat && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        🕌 Zakat
                      </span>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          {formatCurrency(donation.amount_base, baseCurrency)}
                        </p>
                        {donation.currency !== baseCurrency && (
                          <p className="text-slate-500 text-xs">
                            {formatCurrency(donation.amount, donation.currency)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onDelete(donation.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </NeonCard>
              );
            })}
          </div>
        ) : (
          <NeonCard className="p-8 text-center">
            <p className="text-4xl mb-3">💚</p>
            <p className="text-white font-medium mb-2">No donations logged yet</p>
            <p className="text-slate-400 text-sm">Start tracking your generosity</p>
          </NeonCard>
        )}
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Header with drag handle */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>
            <h3 className="text-white text-lg font-semibold">Add Donation</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Amount *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="100"
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-14"
                />
              </div>
              <div>
                <Label className="text-slate-300">Currency</Label>
                <CurrencySelector
                  value={formData.currency}
                  onChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Date</Label>
              <MobileDatePicker
                value={formData.date}
                onChange={(v) => setFormData(prev => ({ ...prev, date: v }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Recipient / Description *</Label>
              <Input
                value={formData.recipient}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="e.g., Local charity, Family member"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-14"
              />
            </div>

            <div>
              <Label className="text-slate-300">Category</Label>
              <IOSPicker
                value={formData.category}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                title="Select Category"
                options={CATEGORIES.map(cat => ({ value: cat.value, label: cat.label, icon: cat.icon }))}
                triggerClassName="mt-1"
              />
            </div>

            {expatMode && (
              <div>
                <Label className="text-slate-300">Country Context</Label>
                <CountryContextSelector
                  value={formData.country_context}
                  onChange={(v) => setFormData(prev => ({ ...prev, country_context: v }))}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional details..."
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <Label className="text-slate-300">Private Donation</Label>
              <Switch
                checked={formData.is_private}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_private: v }))}
              />
            </div>

            <div className="h-4" />
          </div>

          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <NeonButton
              onClick={handleSubmit}
              disabled={!formData.amount || !formData.recipient}
              className="w-full min-h-[52px] text-base font-semibold"
              variant="purple"
            >
              Add Donation
            </NeonButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}