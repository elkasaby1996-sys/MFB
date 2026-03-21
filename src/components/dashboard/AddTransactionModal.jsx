import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import MobileSelect from '@/components/ui/MobileSelect';
import { Input } from "@/components/ui/input";
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NeonButton from '@/components/ui/NeonButton';
import AmountInput from '@/components/ui/AmountInput';
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from 'sonner';
import { PRIMARY_CATEGORIES, HOME_SUBCATEGORIES, INCOME_CATEGORIES, validateCategoryStructure } from '@/components/utils/categoryConstants';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { nativeHaptics } from '@/lib/native';

export default function AddTransactionModal({ isOpen, onClose, profile, initialType = 'expense' }) {
  const queryClient = useQueryClient();
  const { handleApiError, handleUserError } = useErrorHandler();
  const [transactionType, setTransactionType] = useState(initialType);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    subCategory: '',
    category_icon: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    merchant: '',
    savings_goal_id: '',
    debt_id: ''
  });
  const [categoryError, setCategoryError] = useState(false);
  const [subCategoryError, setSubCategoryError] = useState(false);

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list('-created_date'),
    enabled: isOpen
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list('-created_date'),
    enabled: isOpen
  });

  useEffect(() => {
    setTransactionType(initialType);
  }, [initialType]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousTransactions = queryClient.getQueryData(['transactions']);
      queryClient.setQueryData(['transactions'], (old = []) => [
      { ...newTransaction, id: `temp-${Date.now()}`, created_date: new Date().toISOString(), updated_date: new Date().toISOString(), created_by: profile?.email || 'user' },
      ...old]
      );
      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      queryClient.setQueryData(['transactions'], context.previousTransactions);
      handleApiError(err, { title: 'Transaction Error', context: 'add-transaction' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      nativeHaptics.notifySuccess();
      toast.success('Transaction added successfully!');
      handleClose();
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavingsGoal.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['savingsGoals'])
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Debt.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['debts'])
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {setCategoryError(true);return;}

    const validation = validateCategoryStructure(formData.category, formData.subCategory);
    if (!validation.valid) {
      if (formData.category === 'Home Expenses' && !formData.subCategory) setSubCategoryError(true);
      handleUserError(validation.error, { title: 'Category Error', context: 'category-validation' });
      return;
    }

    if (formData.category === 'Savings' && !formData.savings_goal_id) {
      handleUserError('Please select a savings goal', { title: 'Savings Goal Required' });
      return;
    }
    if (formData.category === 'Debt' && !formData.debt_id) {
      handleUserError('Please select which debt this payment is for', { title: 'Debt Selection Required' });
      return;
    }

    const transactionData = {
      type: transactionType,
      amount: parseFloat(formData.amount),
      category: formData.category,
      subCategory: formData.subCategory || null,
      category_icon: formData.category_icon,
      categoryVersion: 2,
      date: formData.date,
      notes: formData.notes || null,
      merchant: formData.merchant || null,
      currency: profile?.currency || 'USD',
      linkedDebtId: formData.debt_id || null
    };

    if (formData.category === 'Savings' && formData.savings_goal_id) {
      const selectedGoal = savingsGoals.find((g) => g.id === formData.savings_goal_id);
      if (selectedGoal) {
        await updateGoalMutation.mutateAsync({ id: selectedGoal.id, data: { current_amount: (selectedGoal.current_amount || 0) + parseFloat(formData.amount) } });
      }
    }

    if (formData.category === 'Debt' && formData.debt_id) {
      const selectedDebt = debts.find((d) => d.id === formData.debt_id);
      if (selectedDebt) {
        const newBalance = Math.max(0, (selectedDebt.current_balance || 0) - parseFloat(formData.amount));
        await updateDebtMutation.mutateAsync({ id: selectedDebt.id, data: { current_balance: newBalance, ...(newBalance === 0 ? { status: 'paid_off' } : {}) } });
      }
    }

    createMutation.mutate(transactionData);
  };

  const handleClose = () => {
    setFormData({ amount: '', category: '', subCategory: '', category_icon: '', date: new Date().toISOString().split('T')[0], notes: '', merchant: '', savings_goal_id: '', debt_id: '' });
    setTransactionType('expense');
    setCategoryError(false);
    setSubCategoryError(false);
    onClose();
  };

  const currentCategories = transactionType === 'expense' ? PRIMARY_CATEGORIES : INCOME_CATEGORIES;

  const handleCategorySelect = (categoryName) => {
    const category = currentCategories.find((c) => c.name === categoryName);
    if (category) {
      setFormData((prev) => ({ ...prev, category: category.name, category_icon: category.icon, subCategory: '' }));
      setCategoryError(false);
      setSubCategoryError(false);
    }
  };

  const handleSubCategorySelect = (subCategoryName) => {
    const subCat = HOME_SUBCATEGORIES.find((sc) => sc.name === subCategoryName);
    if (subCat) {
      setFormData((prev) => ({ ...prev, subCategory: subCat.name, category_icon: subCat.icon }));
      setSubCategoryError(false);
    }
  };

  const handleTypeChange = (type) => {
    nativeHaptics.selection();
    setTransactionType(type);
    setFormData((prev) => ({ ...prev, category: '', subCategory: '', category_icon: '', savings_goal_id: '', debt_id: '' }));
    setCategoryError(false);
    setSubCategoryError(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
        
        <div className="px-5 pb-4">
          <h3 className="text-white text-lg font-semibold">Add Transaction</h3>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Type Toggle */}
            <div className="flex gap-3">
              <button type="button" onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-4 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98] ${transactionType === 'expense' ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500' : 'bg-slate-800 text-slate-400'}`}>
                <ArrowDownRight className="w-6 h-6" />
                <span className="font-semibold text-base">Expense</span>
              </button>
              <button type="button" onClick={() => handleTypeChange('income')}
              className={`flex-1 py-4 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98] ${transactionType === 'income' ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500' : 'bg-slate-800 text-slate-400'}`}>
                <ArrowUpRight className="w-6 h-6" />
                <span className="font-semibold text-base">Income</span>
              </button>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-slate-300 text-sm font-medium">Amount</Label>
              <AmountInput value={formData.amount} onChange={(value) => setFormData((prev) => ({ ...prev, amount: value }))} currency={profile?.currency || 'USD'} className="bg-slate-800 border-slate-700 text-white h-14 mt-2 text-xl" required />
            </div>

            {/* Category */}
            <div>
              <Label className="text-slate-300 text-sm font-medium">Category</Label>
              <MobileSelect
                value={formData.category}
                onValueChange={handleCategorySelect}
                options={currentCategories.map((cat) => ({ value: cat.name, label: cat.name, icon: cat.icon }))}
                placeholder="Select category"
                title="Select Category"
                error={categoryError}
                triggerClassName="mt-2" />

              {categoryError && <p className="text-red-400 text-sm mt-1">Please select a category</p>}
            </div>

            {/* Home Sub-Category */}
            {formData.category === 'Home Expenses' &&
            <div>
                <Label className="text-slate-300 text-sm font-medium">Home Type *</Label>
                <MobileSelect
                value={formData.subCategory}
                onValueChange={handleSubCategorySelect}
                options={HOME_SUBCATEGORIES.map((sc) => ({ value: sc.name, label: sc.name, icon: sc.icon }))}
                placeholder="Select home category"
                title="Select Home Type"
                error={subCategoryError}
                triggerClassName="mt-2" />

                {subCategoryError && <p className="text-red-400 text-sm mt-1">Please select a home category</p>}
              </div>
            }

            {/* Date */}
            <div>
              <Label className="text-slate-300 text-sm font-medium">Date</Label>
              <MobileDatePicker
                value={formData.date}
                onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                className="mt-2"
              />
            </div>

            {/* Savings Goal */}
            {formData.category === 'Savings' &&
            <div>
                <Label className="text-slate-300 text-sm font-medium">Select Savings Goal</Label>
                <MobileSelect
                value={formData.savings_goal_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, savings_goal_id: value }))}
                options={savingsGoals.map((g) => ({ value: g.id, label: g.name, icon: g.icon }))}
                placeholder={savingsGoals.length === 0 ? 'No goals yet — create one first' : 'Choose a goal'}
                title="Select Savings Goal"
                disabled={savingsGoals.length === 0}
                triggerClassName="mt-2" />

              </div>
            }

            {/* Debt Selector */}
            {formData.category === 'Debt' &&
            <div>
                <Label className="text-slate-300 text-sm font-medium">Which Debt? *</Label>
                <MobileSelect
                value={formData.debt_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, debt_id: value }))}
                options={debts.map((d) => ({ value: d.id, label: d.name, icon: '💳', description: `Balance: ${profile?.currency || 'USD'} ${d.current_balance?.toFixed(2)}` }))}
                placeholder={debts.length === 0 ? 'No debts found — add one first' : 'Select a debt'}
                title="Select Debt"
                disabled={debts.length === 0}
                triggerClassName="mt-2" />

                {formData.debt_id && <p className="text-cyan-400 text-xs mt-2">💡 This payment will be tracked against your selected debt</p>}
              </div>
            }

            {/* Merchant */}
            <div>
              <Label className="text-slate-300 text-sm font-medium">Merchant (Optional)</Label>
              <Input value={formData.merchant} onChange={(e) => setFormData((prev) => ({ ...prev, merchant: e.target.value }))} placeholder="e.g. Starbucks" className="bg-slate-800 border-slate-700 text-white mt-2 h-14" />
            </div>

            {/* Notes */}
              <div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm font-medium">Notes (Optional)</Label>
                <span className="text-xs text-slate-500">{(formData.notes || '').length}/100</span>
              </div>
              <Textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Add a note..." className="bg-slate-800 border-slate-700 text-white mt-2 min-h-[100px]" rows={4} maxLength={100} />
            </div>

            <div className="h-4" />
          </div>

          {/* Sticky Footer */}
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <NeonButton type="submit" haptic="confirm" loading={createMutation.isPending} disabled={!formData.amount || !formData.category} className="w-full min-h-[52px] text-base font-semibold">
              Add Transaction
            </NeonButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>);

}
