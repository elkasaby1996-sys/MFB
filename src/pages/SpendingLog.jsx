import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import CategoryIcon, { CATEGORIES, getCategoryByName } from '@/components/ui/CategoryIcon';
import ReceiptScanner from '@/components/spending/ReceiptScanner';
import { Input } from "@/components/ui/input";
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from '@/components/ui/MobileSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  CreditCard,
  Banknote,
  Building2,
  MoreHorizontal,
  Trash2,
  Edit,
  Camera,
  X
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank', label: 'Bank', icon: Building2 },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const PAGE_SIZE = 50;

export default function SpendingLog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  const [showAddModal, setShowAddModal] = useState(urlParams.get('action') === 'add');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [page, setPage] = useState(0);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: allTransactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => base44.entities.Transaction.list('-date', PAGE_SIZE, page * PAGE_SIZE),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setShowAddModal(false);
      setEditingTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setShowAddModal(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    },
  });

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    payment_method: 'card',
    merchant: '',
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        amount: editingTransaction.amount?.toString() || '',
        category: editingTransaction.category || 'Food',
        type: editingTransaction.type || 'expense',
        date: editingTransaction.date || format(new Date(), 'yyyy-MM-dd'),
        notes: editingTransaction.notes || '',
        payment_method: editingTransaction.payment_method || 'card',
        merchant: editingTransaction.merchant || '',
      });
      setShowAddModal(true);
    }
  }, [editingTransaction]);

  const handleSubmit = () => {
    const cat = getCategoryByName(formData.category);
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      category_icon: cat.icon,
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: 'Food',
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      payment_method: 'card',
      merchant: '',
    });
    setEditingTransaction(null);
  };

  const handleScannedTransaction = (scannedData) => {
    setFormData(prev => ({
      ...prev,
      ...scannedData,
    }));
    setShowScanner(false);
    setShowAddModal(true);
  };

  // Filter transactions
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const filteredTransactions = allTransactions.filter(tx => {
    const date = new Date(tx.date);
    const inMonth = date >= monthStart && date <= monthEnd;
    const matchesSearch = !searchQuery || 
      tx.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    
    return inMonth && matchesSearch && matchesCategory;
  });

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = tx.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b) - new Date(a)
  );

  const monthTotal = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const currency = profile?.currency || 'USD';
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <main className="flex-1 overflow-y-auto pt-safe">
        <SpaceBackground>
          <div className="px-4 sm:px-6 pb-24">
            <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4">
          
          {/* Month Selector & Total */}
          <NeonCard className="p-4">
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                className="p-2 text-slate-400 active:opacity-60 active:scale-95 transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              >
                ←
              </button>
              <div className="text-center flex-1 min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  {format(selectedMonth, 'MMMM yyyy')}
                </p>
                <p className="text-pink-400 text-xs sm:text-sm whitespace-nowrap">
                  Total: {formatCurrency(monthTotal)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
                className="p-2 text-slate-400 active:opacity-60 active:scale-95 transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              >
                →
              </button>
            </div>
          </NeonCard>

          {/* Search & Filter */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="bg-slate-800 border-slate-700 text-white pl-10 h-12"
              />
            </div>
            <MobileSelect
              value={filterCategory}
              onValueChange={setFilterCategory}
              options={[{ value: 'all', label: 'All', icon: '🔍' }, ...CATEGORIES.map(cat => ({ value: cat.name, label: cat.name, icon: cat.icon }))]}
              title="Filter by Category"
              triggerClassName="w-28 sm:w-32 h-12"
            />
          </div>

          {/* Add Buttons */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <NeonButton onClick={() => { resetForm(); setShowAddModal(true); }} className="w-full h-12 sm:h-auto text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Manually</span>
              <span className="sm:hidden">Manual</span>
            </NeonButton>
            <NeonButton 
              onClick={() => setShowScanner(true)} 
              className="w-full h-12 sm:h-auto text-sm sm:text-base"
              variant="purple"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Scan Receipt</span>
              <span className="sm:hidden">Scan</span>
            </NeonButton>
          </div>

          {/* Transactions List */}
          {isLoading && <p className="text-slate-400 text-center py-8">Loading...</p>}
          {error && <p className="text-red-400 text-center py-8">Failed to load transactions.</p>}
          {!isLoading && !error && filteredTransactions.length === 0 && (
            <p className="text-slate-400 text-center py-8">No transactions yet. Add your first transaction!</p>
          )}
          {!isLoading && !error && filteredTransactions.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {sortedDates.length > 0 ? (
              <>
              {sortedDates.map(date => (
                <div key={date}>
                  <p className="text-slate-400 text-xs sm:text-sm mb-2 px-1">
                    {format(new Date(date), 'EEEE, MMM d')}
                  </p>
                  <NeonCard className="divide-y divide-slate-800">
                    {groupedTransactions[date].map(tx => {
                      const cat = getCategoryByName(tx.category);
                      return (
                        <motion.div
                          key={tx.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 flex items-center gap-3"
                        >
                          <CategoryIcon category={cat} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {tx.merchant || tx.category}
                            </p>
                            <p className="text-slate-500 text-sm truncate">
                              {tx.notes || tx.category}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-semibold text-sm sm:text-base whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                            <div className="flex gap-1 sm:gap-2 mt-1 justify-end">
                              <button
                                onClick={() => setEditingTransaction(tx)}
                                className="text-slate-500 active:text-cyan-400 active:scale-95 active:opacity-70 transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center p-2"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(tx.id)}
                                className="text-slate-500 active:text-red-400 active:scale-95 active:opacity-70 transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </NeonCard>
                </div>
              ))
              }
              {allTransactions.length === PAGE_SIZE && (
                <div className="flex justify-center pt-4">
                  <NeonButton onClick={() => setPage(prev => prev + 1)}>
                    Load More
                  </NeonButton>
                </div>
              )}
              </>
            ) : null}
          </div>
          )}
            </div>
          </div>
        </SpaceBackground>
      </main>
      
      <BottomNav currentPage="SpendingLog" />
      
      {/* Safe area bottom spacer */}
      <div style={{ height: 'var(--safe-area-bottom, 0px)' }} className="bg-slate-900" />

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </DialogTitle>
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
            {/* Type Toggle */}
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                className={`flex-1 py-3 sm:py-3.5 rounded-xl font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] active:opacity-80 min-h-[48px] ${
                  formData.type === 'expense'
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                className={`flex-1 py-3 sm:py-3.5 rounded-xl font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] active:opacity-80 min-h-[48px] ${
                  formData.type === 'income'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div className="w-full">
              <Label className="text-slate-300 text-sm">Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="bg-slate-800 border-slate-700 text-white text-xl h-14 mt-1 w-full"
              />
            </div>

            {/* Category */}
            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Category</Label>
              <MobileSelect
                value={formData.category}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                options={CATEGORIES.filter(c =>
                  formData.type === 'income'
                    ? ['Income', 'Salary', 'Freelance', 'Other'].includes(c.name)
                    : !['Income', 'Salary', 'Freelance'].includes(c.name)
                ).map(cat => ({ value: cat.name, label: cat.name, icon: cat.icon }))}
                title="Select Category"
                triggerClassName="mt-1"
              />
            </div>

            {/* Date */}
            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Date</Label>
              <MobileDatePicker
                value={formData.date}
                onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                className="mt-1"
              />
            </div>

            {/* Merchant */}
            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Merchant / Source</Label>
              <Input
                value={formData.merchant}
                onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                placeholder="e.g. Starbucks"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12 w-full"
              />
            </div>

            {/* Payment Method */}
            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Payment Method</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 w-full">
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value }))}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer active:scale-[0.98] active:opacity-80 min-h-[60px] ${
                        formData.payment_method === method.value
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs whitespace-nowrap">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="w-full">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm sm:text-base">Notes (optional)</Label>
                <span className="text-xs text-slate-500">{(formData.notes || '').length}/100</span>
              </div>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add a note..."
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[80px] w-full"
                rows={3}
                maxLength={100}
              />
            </div>

          
          {/* Extra spacing */}
          <div className="h-4" />
          </div>
          
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 sm:px-6 py-4 pb-safe">
            <div className="flex gap-3">
              <NeonButton
                type="button"
                variant="secondary"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="hidden sm:flex flex-1 min-h-[52px]"
              >
                Cancel
              </NeonButton>
              <NeonButton 
                onClick={handleSubmit} 
                loading={createMutation.isPending || updateMutation.isPending}
                disabled={!formData.amount || !formData.category}
                className="w-full sm:flex-1 min-h-[52px] text-base font-semibold"
              >
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Scanner */}
      {showScanner && (
        <ReceiptScanner
          onTransactionExtracted={handleScannedTransaction}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
}