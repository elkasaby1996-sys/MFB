import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import SegmentedControl from '@/components/ui/SegmentedControl';
import MobileSelect from '@/components/ui/MobileSelect';
import { Input } from '@/components/ui/input';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import NeonButton from '@/components/ui/NeonButton';
import AmountInput from '@/components/ui/AmountInput';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    debt_id: '',
  });
  const [categoryError, setCategoryError] = useState(false);
  const [subCategoryError, setSubCategoryError] = useState(false);

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list('-created_date'),
    enabled: isOpen,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list('-created_date'),
    enabled: isOpen,
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
        ...old,
      ]);
      return { previousTransactions };
    },
    onError: (err, _newTransaction, context) => {
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
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavingsGoal.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['savingsGoals']),
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Debt.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['debts']),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      setCategoryError(true);
      return;
    }

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
      linkedDebtId: formData.debt_id || null,
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
      <SheetContent side="bottom" hideClose className="flex flex-col rounded-t-[28px] border-slate-800 bg-slate-950" style={{ paddingBottom: 0 }}>
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-slate-700" />
        </div>

        <div className="px-5 pb-3 pt-3">
          <h3 className="text-lg font-semibold text-white">Add transaction</h3>
          <p className="mt-1 text-sm text-slate-500">Capture the essentials without leaving the flow.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-2 sm:px-5">
            <div className="space-y-2">
              <Label>Type</Label>
              <SegmentedControl
                value={transactionType}
                onValueChange={handleTypeChange}
                size="md"
                fullWidth
                ariaLabel="Transaction type"
                options={[
                  { value: 'expense', label: 'Expense', icon: ArrowDownRight, className: transactionType === 'expense' ? '!text-rose-600' : undefined },
                  { value: 'income', label: 'Income', icon: ArrowUpRight, className: transactionType === 'income' ? '!text-emerald-600' : undefined },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <AmountInput value={formData.amount} onChange={(value) => setFormData((prev) => ({ ...prev, amount: value }))} currency={profile?.currency || 'USD'} className="h-12 bg-slate-800/90 text-[22px]" required />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <MobileSelect
                value={formData.category}
                onValueChange={handleCategorySelect}
                options={currentCategories.map((cat) => ({ value: cat.name, label: cat.name, icon: cat.icon }))}
                placeholder="Select category"
                title="Select Category"
                error={categoryError}
              />
              {categoryError ? <p className="text-sm text-red-400">Please select a category</p> : null}
            </div>

            {formData.category === 'Home Expenses' ? (
              <div className="space-y-2">
                <Label>Home type</Label>
                <MobileSelect
                  value={formData.subCategory}
                  onValueChange={handleSubCategorySelect}
                  options={HOME_SUBCATEGORIES.map((sc) => ({ value: sc.name, label: sc.name, icon: sc.icon }))}
                  placeholder="Select home category"
                  title="Select Home Type"
                  error={subCategoryError}
                />
                {subCategoryError ? <p className="text-sm text-red-400">Please select a home category</p> : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Date</Label>
              <MobileDatePicker value={formData.date} onChange={(date) => setFormData((prev) => ({ ...prev, date }))} />
            </div>

            {formData.category === 'Savings' ? (
              <div className="space-y-2">
                <Label>Savings goal</Label>
                <MobileSelect
                  value={formData.savings_goal_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, savings_goal_id: value }))}
                  options={savingsGoals.map((g) => ({ value: g.id, label: g.name, icon: g.icon }))}
                  placeholder={savingsGoals.length === 0 ? 'No goals yet — create one first' : 'Choose a goal'}
                  title="Select Savings Goal"
                  disabled={savingsGoals.length === 0}
                />
              </div>
            ) : null}

            {formData.category === 'Debt' ? (
              <div className="space-y-2">
                <Label>Debt account</Label>
                <MobileSelect
                  value={formData.debt_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, debt_id: value }))}
                  options={debts.map((d) => ({ value: d.id, label: d.name, icon: '💳', description: `Balance: ${profile?.currency || 'USD'} ${d.current_balance?.toFixed(2)}` }))}
                  placeholder={debts.length === 0 ? 'No debts found — add one first' : 'Select a debt'}
                  title="Select Debt"
                  disabled={debts.length === 0}
                />
                {formData.debt_id ? <p className="text-xs text-cyan-400">This payment will be tracked against your selected debt.</p> : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Merchant</Label>
              <Input value={formData.merchant} onChange={(e) => setFormData((prev) => ({ ...prev, merchant: e.target.value }))} placeholder="Starbucks" className="bg-slate-800/90" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Notes</Label>
                <span className="text-xs text-slate-500">{(formData.notes || '').length}/100</span>
              </div>
              <Textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Add a note" className="min-h-[92px] bg-slate-800/90" rows={4} maxLength={100} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-slate-800/90 bg-slate-950/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
            <NeonButton type="submit" haptic="confirm" loading={createMutation.isPending} disabled={!formData.amount || !formData.category} className="w-full min-h-[48px] rounded-2xl text-[15px] font-semibold">
              Add transaction
            </NeonButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
