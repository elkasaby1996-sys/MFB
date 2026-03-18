import React, { useState, useMemo } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PaywallGate from '@/components/subscription/PaywallGate';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import MobileSelect from "@/components/ui/MobileSelect";
import { Trash2, Clock, TrendingUp, Lightbulb, Save, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/components/currency/currencyUtils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TIME_HORIZONS = [
  { value: '1', label: '1 year' },
  { value: '3', label: '3 years' },
  { value: '5', label: '5 years' },
  { value: '10', label: '10 years' },
  { value: '20', label: '20 years' },
  { value: 'custom', label: 'Custom' },
];

const STORAGE_KEY = 'mfb_real_cost_scenarios';

function loadScenarios() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveScenarios(scenarios) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export default function RealCostMode() {
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const currency = profiles?.[0]?.currency || 'USD';

  const [form, setForm] = useState({
    itemName: '',
    price: '',
    hourlyWage: '',
    returnRate: 8,
    horizon: '5',
    customHorizon: '',
    compounding: 'yearly',
  });

  const [scenarios, setScenarios] = useState(loadScenarios);
  const [errors, setErrors] = useState({});

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const years = form.horizon === 'custom'
    ? (parseFloat(form.customHorizon) || 0)
    : parseInt(form.horizon);

  const price = parseFloat(form.price) || 0;
  const wage = parseFloat(form.hourlyWage) || 0;
  const rate = parseFloat(form.returnRate) / 100;

  const results = useMemo(() => {
    if (!price || !wage) return null;
    const hours = price / wage;
    const days = hours / 8;
    let fv = 0;
    if (years > 0) {
      if (form.compounding === 'monthly') {
        fv = price * Math.pow(1 + rate / 12, 12 * years);
      } else {
        fv = price * Math.pow(1 + rate, years);
      }
    }
    const gain = fv - price;
    return { hours, days, fv, gain };
  }, [price, wage, rate, years, form.compounding]);

  const chartData = useMemo(() => {
    if (!price || years <= 0) return [];
    const points = [];
    const steps = Math.min(years, 20);
    for (let i = 0; i <= steps; i++) {
      const t = (years / steps) * i;
      let val;
      if (form.compounding === 'monthly') {
        val = price * Math.pow(1 + rate / 12, 12 * t);
      } else {
        val = price * Math.pow(1 + rate, t);
      }
      points.push({ year: parseFloat(t.toFixed(1)), value: parseFloat(val.toFixed(2)) });
    }
    return points;
  }, [price, rate, years, form.compounding]);

  const validate = () => {
    const e = {};
    if (!price) e.price = 'Enter item price';
    if (!wage) e.wage = 'Enter hourly wage';
    if (form.horizon === 'custom' && !form.customHorizon) e.customHorizon = 'Enter years';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const scenario = {
      id: Date.now(),
      itemName: form.itemName || 'Unnamed Item',
      price,
      currency,
      hours: results?.hours,
      horizon: years,
      fv: results?.fv,
      returnRate: form.returnRate,
    };
    const updated = [scenario, ...scenarios];
    setScenarios(updated);
    saveScenarios(updated);
  };

  const handleDelete = (id) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    saveScenarios(updated);
  };

  const mascoTip = results
    ? results.hours > 10
      ? "Bro… that's a lot of your life 😅"
      : years >= 10
      ? "Compounding gets spicy over time 🚀"
      : null
    : null;

  return (
    <SpaceBackground>
      <SubPageHeader title="Real Cost Mode" />
      <PaywallGate featureId="real_cost_mode" requiredTier="pro">
      <main className="pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-5 py-4">

          <p className="text-slate-400 text-sm text-center">
            See what something really costs: hours of your life + missed compounding.
          </p>

          {/* Card 1: Inputs */}
          <NeonCard className="p-5 space-y-4" glowColor="cyan">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">What are you buying?</h2>
            </div>

            <div>
              <Label className="text-slate-300">Item Name (optional)</Label>
              <Input
                value={form.itemName}
                onChange={e => update('itemName', e.target.value)}
                placeholder="e.g., New sneakers"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Item Price ({currency})</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={e => update('price', e.target.value)}
                  placeholder="100"
                  className={`bg-slate-800 border-slate-700 text-white mt-1 ${errors.price ? 'border-red-500' : ''}`}
                />
                {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <Label className="text-slate-300">Hourly Wage ({currency})</Label>
                <Input
                  type="number"
                  value={form.hourlyWage}
                  onChange={e => update('hourlyWage', e.target.value)}
                  placeholder="10"
                  className={`bg-slate-800 border-slate-700 text-white mt-1 ${errors.wage ? 'border-red-500' : ''}`}
                />
                {errors.wage && <p className="text-red-400 text-xs mt-1">{errors.wage}</p>}
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Return Rate: {form.returnRate}%</Label>
              {rate < 0 && (
                <p className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Negative return means loss
                </p>
              )}
              <Slider
                value={[form.returnRate]}
                onValueChange={([v]) => update('returnRate', v)}
                min={-10}
                max={30}
                step={0.5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>-10%</span><span>30%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Time Horizon</Label>
                <MobileSelect
                  value={form.horizon}
                  onValueChange={v => update('horizon', v)}
                  options={TIME_HORIZONS}
                  title="Select Time Horizon"
                  triggerClassName="mt-1"
                />
                {form.horizon === 'custom' && (
                  <Input
                    type="number"
                    value={form.customHorizon}
                    onChange={e => update('customHorizon', e.target.value)}
                    placeholder="Years"
                    className={`bg-slate-800 border-slate-700 text-white mt-2 ${errors.customHorizon ? 'border-red-500' : ''}`}
                  />
                )}
              </div>
              <div>
                <Label className="text-slate-300">Compounding</Label>
                <MobileSelect
                  value={form.compounding}
                  onValueChange={v => update('compounding', v)}
                  options={[
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                  title="Select Compounding"
                  triggerClassName="mt-1"
                />
              </div>
            </div>
          </NeonCard>

          {/* Card 2: Results */}
          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <NeonCard className="p-5 space-y-5" glowColor="purple">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h2 className="text-white font-semibold">Real Cost Breakdown</h2>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-slate-400 text-sm mb-1">Hours of your life</p>
                    <p className="text-5xl font-bold text-cyan-400 drop-shadow-[0_0_12px_rgba(0,255,255,0.6)]">
                      {results.hours.toFixed(1)}h
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      ≈ {results.days.toFixed(1)} work days (8h/day)
                    </p>
                  </div>

                  {years > 0 && (
                    <div className="border-t border-slate-700 pt-4 space-y-2">
                      <p className="text-slate-300 text-sm font-medium">Opportunity Value (if invested instead)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                          <p className="text-slate-400 text-xs mb-1">Future Value</p>
                          <p className="text-green-400 font-bold text-lg">{formatCurrency(results.fv, currency)}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                          <p className="text-slate-400 text-xs mb-1">Total Gain</p>
                          <p className={`font-bold text-lg ${results.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            +{formatCurrency(results.gain, currency)}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs text-center">
                        Over {years} year{years !== 1 ? 's' : ''} at {form.returnRate}% ({form.compounding} compounding)
                      </p>
                    </div>
                  )}

                  {chartData.length > 1 && (
                    <div className="h-40 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="year" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}y`} />
                          <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={v => [formatCurrency(v, currency), 'Value']}
                            labelFormatter={v => `Year ${v}`}
                          />
                          <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </NeonCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mascot tip */}
          <AnimatePresence>
            {mascoTip && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <NeonCard className="p-4 flex items-center gap-3" glowColor="teal">
                  <span className="text-2xl">🤖</span>
                  <p className="text-cyan-300 text-sm font-medium">{mascoTip}</p>
                </NeonCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card 3: Education */}
          <NeonCard className="p-4 space-y-2" glowColor="green">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <p className="text-slate-300 text-sm font-semibold">How this works</p>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every purchase costs you real hours of your life. Buying now means giving up that time — and the future growth that money could have earned through compounding interest.
            </p>
            <p className="text-slate-500 text-xs italic">
              ⚠️ This is an educational estimate, not financial advice.
            </p>
          </NeonCard>

          {/* Card 4: Save Scenario */}
          {results && (
            <NeonButton onClick={handleSave} variant="cyan" className="w-full">
              <Save className="w-4 h-4" />
              Save Scenario
            </NeonButton>
          )}

          {/* Saved Scenarios */}
          {scenarios.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Saved Scenarios</h3>
              {scenarios.map(s => (
                <NeonCard key={s.id} className="p-4" glowColor="purple">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{s.itemName}</p>
                      <p className="text-slate-400 text-sm">{formatCurrency(s.price, s.currency)} · {s.hours?.toFixed(1)}h work</p>
                      {s.horizon > 0 && (
                        <p className="text-purple-400 text-xs mt-1">
                          → {formatCurrency(s.fv, s.currency)} in {s.horizon}y at {s.returnRate}%
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(s.id)} className="text-slate-500 hover:text-red-400 ml-3">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </NeonCard>
              ))}
            </div>
          )}

        </div>
      </main>
      </PaywallGate>
      <BottomNav currentPage="More" />
    </SpaceBackground>
  );
}