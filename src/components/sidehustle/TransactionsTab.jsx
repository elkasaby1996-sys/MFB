import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import IOSPicker from '@/components/ui/IOSPicker';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { format } from 'date-fns';

const INCOME_CATEGORIES = ['Freelance', 'Content Creation', 'Consulting', 'Product Sales', 'Other Income'];
const EXPENSE_CATEGORIES = ['Software', 'Marketing', 'Equipment', 'Travel', 'Supplies', 'Fees', 'Other'];

export default function TransactionsTab({ 
  transactions, 
  clients,
  onAdd, 
  onDelete,
  currency = 'USD' 
}) {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, income, expense
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    client_id: '',
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = () => {
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount),
      currency,
    });
    setShowModal(false);
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      client_id: '',
    });
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <>
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <NeonCard className="p-4" glowColor="green">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <p className="text-slate-400 text-sm">Total Income</p>
            </div>
            <p className="text-green-400 font-bold text-xl">{formatCurrency(totalIncome)}</p>
          </NeonCard>
          <NeonCard className="p-4" glowColor="pink">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <p className="text-slate-400 text-sm">Total Expenses</p>
            </div>
            <p className="text-red-400 font-bold text-xl">{formatCurrency(totalExpenses)}</p>
          </NeonCard>
        </div>

        {/* Filters & Add */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <NeonButton onClick={() => setShowModal(true)} variant="purple" size="sm">
            <Plus className="w-4 h-4" />
          </NeonButton>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredTransactions.map(transaction => {
              const client = clients.find(c => c.id === transaction.client_id);
              return (
                <NeonCard 
                  key={transaction.id} 
                  className="p-4" 
                  glowColor={transaction.type === 'income' ? 'green' : 'pink'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <p className="text-white font-medium">{transaction.category}</p>
                      </div>
                      {transaction.description && (
                        <p className="text-slate-400 text-sm">{transaction.description}</p>
                      )}
                      {client && (
                        <p className="text-slate-500 text-xs mt-1">Client: {client.name}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <button
                        onClick={() => onDelete(transaction.id)}
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
            <p className="text-4xl mb-3">💼</p>
            <p className="text-white font-medium mb-2">No transactions yet</p>
            <p className="text-slate-400 text-sm">Start tracking your side hustle income and expenses</p>
          </NeonCard>
        )}
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          <div className="px-5 pb-4">
            <h3 className="text-white text-lg font-semibold">Add Transaction</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-4">
            <div>
              <Label className="text-slate-300">Type</Label>
              <IOSPicker
                value={formData.type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v, category: '' }))}
                title="Type"
                options={[
                  { value: 'income', label: 'Income', icon: '📈' },
                  { value: 'expense', label: 'Expense', icon: '📉' },
                ]}
                triggerClassName="mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Category *</Label>
              <IOSPicker
                value={formData.category}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                title="Select Category"
                placeholder="Select category"
                options={categories.map(cat => ({ value: cat, label: cat }))}
                triggerClassName="mt-1"
              />
            </div>

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
                <Label className="text-slate-300">Date</Label>
                <MobileDatePicker
                  value={formData.date}
                  onChange={(v) => setFormData(prev => ({ ...prev, date: v }))}
                  className="mt-1"
                />
              </div>
            </div>

            {formData.type === 'income' && clients.length > 0 && (
              <div>
                <Label className="text-slate-300">Client (Optional)</Label>
                <IOSPicker
                  value={formData.client_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                  title="Select Client"
                  placeholder="Select client"
                  options={[
                    { value: '', label: 'None' },
                    ...clients.map(c => ({ value: c.id, label: c.name }))
                  ]}
                  triggerClassName="mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What was this for?"
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[80px]"
              />
            </div>

            <div className="h-2" />
          </div>

          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <NeonButton
              onClick={handleSubmit}
              disabled={!formData.category || !formData.amount}
              className="w-full min-h-[52px] text-base font-semibold"
              variant="purple"
            >
              Add Transaction
            </NeonButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}