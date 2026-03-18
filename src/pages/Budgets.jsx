import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import ScreenScrollContainer from '@/components/layout/ScreenScrollContainer';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import CategoryIcon, { CATEGORIES, getCategoryByName } from '@/components/ui/CategoryIcon';
import BudgetTrendChart from '@/components/budgets/BudgetTrendChart';
import VariableIncomeSetup from '@/components/budgets/VariableIncomeSetup';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MobileSelect from '@/components/ui/MobileSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Target, TrendingUp, BarChart, X, Lock } from "lucide-react";
import { usePremium } from '@/components/providers/PremiumProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QueryWrapper from '@/components/ui/QueryWrapper';

const FREE_BUDGET_LIMIT = 5;

export default function Budgets() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentTier } = usePremium();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [activeTab, setActiveTab] = useState('budgets');
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: budgets = [], isLoading: budgetsLoading, error: budgetsError } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onMutate: async (newBudget) => {
      await queryClient.cancelQueries(['budgets']);
      const previous = queryClient.getQueryData(['budgets']);
      queryClient.setQueryData(['budgets'], (old = []) => [
        ...old,
        { ...newBudget, id: `temp-${Date.now()}` },
      ]);
      setShowAddModal(false);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['budgets'], context.previous);
      setShowAddModal(true);
    },
    onSettled: () => queryClient.invalidateQueries(['budgets']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['budgets']);
      const previous = queryClient.getQueryData(['budgets']);
      queryClient.setQueryData(['budgets'], (old = []) =>
        old.map(b => b.id === id ? { ...b, ...data } : b)
      );
      setShowAddModal(false);
      setEditingBudget(null);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['budgets'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries(['budgets']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['budgets']);
      const previous = queryClient.getQueryData(['budgets']);
      queryClient.setQueryData(['budgets'], (old = []) => old.filter(b => b.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['budgets'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries(['budgets']),
  });

  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
    customCategory: '',
    customIcon: '💰',
    rolloverEnabled: false,
    isGoalBased: false,
    linkedGoalId: '',
    isVariable: false,
    variablePercentage: 10,
  });

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category: editingBudget.category,
        amount: editingBudget.amount?.toString() || '',
        customCategory: '',
        customIcon: '💰',
        rolloverEnabled: editingBudget.rollover_enabled || false,
        isGoalBased: editingBudget.is_goal_based || false,
        linkedGoalId: editingBudget.linked_goal_id || '',
        isVariable: editingBudget.is_variable || false,
        variablePercentage: editingBudget.variable_percentage || 10,
      });
      setShowCustomCategory(editingBudget.is_custom || false);
      setShowAddModal(true);
    }
  }, [editingBudget]);

  const handleSubmit = () => {
    const isCustom = showCustomCategory && formData.customCategory;
    const categoryName = isCustom ? formData.customCategory : formData.category;
    const cat = isCustom ? { icon: formData.customIcon } : getCategoryByName(formData.category);
    
    // Calculate rollover from previous month
    let rolloverAmount = 0;
    if (formData.rolloverEnabled && !editingBudget) {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevBudget = budgets.find(b => 
        b.category === categoryName && 
        b.month === prevMonth && 
        b.year === prevYear &&
        b.rollover_enabled
      );
      if (prevBudget) {
        const prevSpent = transactions
          .filter(t => {
            const date = new Date(t.date);
            return t.type === 'expense' && 
              t.category === categoryName &&
              date.getMonth() + 1 === prevMonth &&
              date.getFullYear() === prevYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        rolloverAmount = Math.max(0, prevBudget.amount - prevSpent);
      }
    }

    // Calculate variable amount if enabled
    let finalAmount = parseFloat(formData.amount);
    if (formData.isVariable && monthlyIncome > 0) {
      finalAmount = (monthlyIncome * formData.variablePercentage) / 100;
    }

    const data = {
      category: categoryName,
      category_icon: cat.icon,
      is_custom: isCustom,
      amount: finalAmount,
      rollover_enabled: formData.rolloverEnabled,
      rollover_amount: editingBudget ? (editingBudget.rollover_amount || 0) : rolloverAmount,
      is_goal_based: formData.isGoalBased,
      linked_goal_id: formData.isGoalBased ? formData.linkedGoalId : null,
      is_variable: formData.isVariable,
      variable_percentage: formData.isVariable ? formData.variablePercentage : null,
      month: currentMonth,
      year: currentYear,
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({ 
      category: 'Food', 
      amount: '', 
      customCategory: '', 
      customIcon: '💰', 
      rolloverEnabled: false,
      isGoalBased: false,
      linkedGoalId: '',
      isVariable: false,
      variablePercentage: 10,
    });
    setEditingBudget(null);
    setShowCustomCategory(false);
  };

  // Calculate spending per category
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthExpenses = transactions.filter(t => {
    const date = new Date(t.date);
    return t.type === 'expense' && date >= monthStart && date <= monthEnd;
  });

  const spendingByCategory = thisMonthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const currentMonthBudgets = budgets.filter(b => 
    b.month === currentMonth && b.year === currentYear
  );

  // Categories not yet budgeted
  const budgetedCategories = currentMonthBudgets.map(b => b.category);
  const availableCategories = CATEGORIES.filter(c => 
    !budgetedCategories.includes(c.name) && 
    !['Income', 'Salary', 'Freelance'].includes(c.name)
  );

  const currency = profile?.currency || 'USD';
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isAtLimit = currentTier === 'free' && currentMonthBudgets.length >= FREE_BUDGET_LIMIT;

  const totalBudget = currentMonthBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = currentMonthBudgets.reduce((sum, b) => {
    return sum + (spendingByCategory[b.category] || 0);
  }, 0);

  // Calculate monthly income
  const monthlyIncome = thisMonthExpenses.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <SpaceBackground>
      <ScreenScrollContainer>
      <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4">
          
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-white">Budgets</h1>
            <p className="text-slate-400 text-sm mt-1">Track your spending by category</p>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 rounded-xl p-1 h-12">
              <TabsTrigger 
                value="budgets" 
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white flex items-center justify-center gap-1.5 h-full text-sm"
              >
                <BarChart className="w-4 h-4 flex-shrink-0" />
                <span>Budgets</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trends"
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white flex items-center justify-center gap-1.5 h-full text-sm"
              >
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Trends</span>
              </TabsTrigger>
              <TabsTrigger 
                value="variable"
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white flex items-center justify-center gap-1.5 h-full text-sm"
              >
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>Variable</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="budgets" className="space-y-4 mt-4">
          {/* Month Summary */}
          <NeonCard className="p-4 sm:p-5" glowColor="purple">
            <h2 className="text-white font-semibold mb-3 text-base sm:text-lg">
              {format(now, 'MMMM yyyy')} Budget
            </h2>
            <div className="flex justify-between items-end mb-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-sm">Spent</p>
                <p className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-right flex-1 min-w-0">
                <p className="text-slate-400 text-sm">Budget</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-400 whitespace-nowrap">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
            <NeonProgress 
              value={totalSpent} 
              max={totalBudget || 1}
              color="purple"
            />
            <p className="text-slate-400 text-sm mt-2 text-center whitespace-nowrap">
              {formatCurrency(Math.max(totalBudget - totalSpent, 0))} remaining
            </p>
          </NeonCard>

          {/* Free tier usage counter */}
          {currentTier === 'free' && (
            <p className="text-slate-400 text-xs text-center">
              {currentMonthBudgets.length} / {FREE_BUDGET_LIMIT} budgets used
            </p>
          )}

          {/* Add Budget Button or Upgrade Card */}
          {isAtLimit ? (
            <NeonCard className="p-4 text-center" glowColor="purple">
              <p className="text-white font-semibold mb-1">🚫 You've maxed out your 5 free budgets!</p>
              <p className="text-slate-400 text-sm mb-3">Upgrade to Pro for unlimited budgets</p>
              <NeonButton
                variant="purple"
                className="w-full"
                onClick={() => navigate(createPageUrl('Paywall'), { state: { featureName: 'Unlimited Budgets', requiredTier: 'pro' } })}
              >
                <Lock className="w-4 h-4" />
                Upgrade to Pro
              </NeonButton>
            </NeonCard>
          ) : (
            availableCategories.length > 0 && (
              <NeonButton onClick={() => { resetForm(); setShowAddModal(true); }} className="w-full">
                <Plus className="w-5 h-5" />
                Add Budget Category
              </NeonButton>
            )
          )}

          {/* Budget Cards */}
          <QueryWrapper
            isLoading={budgetsLoading}
            error={budgetsError}
            data={currentMonthBudgets}
            emptyMessage="No budgets set. Create your first budget!"
          >
          <div className="space-y-3">
            {currentMonthBudgets.map((budget, index) => {
              const spent = spendingByCategory[budget.category] || 0;
              const totalBudget = (budget.amount || 0) + (budget.rollover_amount || 0);
              const percentage = totalBudget ? (spent / totalBudget) * 100 : 0;
              const remaining = totalBudget - spent;
              const isOverBudget = percentage >= 100;
              const isWarning = percentage >= 80 && percentage < 100;
              const isGood = percentage < 70;
              const cat = budget.is_custom ? { name: budget.category, icon: budget.category_icon } : getCategoryByName(budget.category);

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NeonCard 
                    className="p-4 sm:p-5"
                    glowColor={isOverBudget ? "pink" : isWarning ? "purple" : "green"}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {budget.is_custom ? (
                          <div className="text-3xl">{cat.icon}</div>
                        ) : (
                          <CategoryIcon category={cat} size="md" />
                        )}
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {budget.category}
                            {budget.is_custom && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">Custom</span>
                            )}
                          </p>
                          <p className="text-slate-400 text-sm whitespace-nowrap">
                            {formatCurrency(spent)} / {formatCurrency(totalBudget)}
                          </p>
                          {budget.rollover_amount > 0 && (
                            <p className="text-cyan-400 text-xs whitespace-nowrap">+{formatCurrency(budget.rollover_amount)} rollover</p>
                          )}
                          {budget.is_goal_based && (
                            <p className="text-purple-400 text-xs whitespace-nowrap flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Goal-based
                            </p>
                          )}
                          {budget.is_variable && (
                            <p className="text-teal-400 text-xs whitespace-nowrap flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {budget.variable_percentage}% of income
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {isOverBudget && (
                          <div className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center gap-1 whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="hidden sm:inline">Over</span>
                          </div>
                        )}
                        {isWarning && !isOverBudget && (
                          <div className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs whitespace-nowrap">
                            <span className="hidden sm:inline">Warning</span>
                            <span className="sm:hidden">⚠️</span>
                          </div>
                        )}
                        {isGood && (
                          <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Good</span>
                          </div>
                        )}
                        <button
                          onClick={() => setEditingBudget(budget)}
                          className="p-2 text-slate-400 hover:text-cyan-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(budget.id)}
                          className="p-2 text-slate-400 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <NeonProgress 
                      value={spent} 
                      max={totalBudget}
                      size="md"
                      color={isOverBudget ? "red" : isWarning ? "yellow" : "green"}
                    />
                    
                    <div className="flex justify-between mt-2 text-sm gap-2">
                      <span className="text-slate-400 whitespace-nowrap">
                        {percentage.toFixed(0)}% used
                      </span>
                      <span className={`whitespace-nowrap ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                      </span>
                    </div>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>
          </QueryWrapper>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 mt-4">
              <BudgetTrendChart 
                budgets={budgets}
                transactions={transactions}
                months={6}
                currency={currency}
              />
              
              {/* Category Trends */}
              <NeonCard className="p-4 sm:p-5" glowColor="cyan">
                <h3 className="text-white font-semibold mb-3">Category Breakdown</h3>
                {currentMonthBudgets.length > 0 ? (
                  <div className="space-y-3">
                    {currentMonthBudgets.map((budget) => {
                      const spent = spendingByCategory[budget.category] || 0;
                      const totalBudget = (budget.amount || 0) + (budget.rollover_amount || 0);
                      const percentage = totalBudget ? (spent / totalBudget) * 100 : 0;
                      
                      return (
                        <div key={budget.id} className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-white font-medium">{budget.category}</p>
                            <p className="text-slate-400 text-sm">
                              {percentage.toFixed(0)}% used
                            </p>
                          </div>
                          <NeonProgress 
                            value={spent}
                            max={totalBudget}
                            size="sm"
                            color={percentage > 100 ? "red" : percentage > 80 ? "yellow" : "green"}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4">No budget data available</p>
                )}
              </NeonCard>
            </TabsContent>

            <TabsContent value="variable" className="space-y-4 mt-4">
              <VariableIncomeSetup 
                monthlyIncome={monthlyIncome}
                currency={currency}
                onSave={(allocations) => {
                  // Create budgets based on allocations
                  allocations.forEach(allocation => {
                    createMutation.mutate({
                      category: allocation.name,
                      category_icon: '💰',
                      is_custom: true,
                      amount: (monthlyIncome * allocation.percentage) / 100,
                      is_variable: true,
                      variable_percentage: allocation.percentage,
                      month: currentMonth,
                      year: currentYear,
                    });
                  });
                  setActiveTab('budgets');
                }}
              />
            </TabsContent>
          </Tabs>
      </div>
      </ScreenScrollContainer>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {editingBudget ? 'Edit Budget' : 'Add Budget'}
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
            {!editingBudget && (
              <div className="flex gap-2 mb-2">
                <NeonButton
                  variant={!showCustomCategory ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setShowCustomCategory(false)}
                  className="flex-1"
                >
                  Preset Category
                </NeonButton>
                <NeonButton
                  variant={showCustomCategory ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setShowCustomCategory(true)}
                  className="flex-1"
                >
                  Custom Category
                </NeonButton>
              </div>
            )}

            {!showCustomCategory ? (
              <div>
                <Label className="text-slate-300">Category</Label>
                <MobileSelect
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  options={(editingBudget ? CATEGORIES : availableCategories).map(cat => ({ value: cat.name, label: cat.name, icon: cat.icon }))}
                  placeholder="Select category"
                  title="Select Category"
                  disabled={!!editingBudget}
                  triggerClassName="mt-1"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-sm">Custom Category Name</Label>
                  <Input
                    value={formData.customCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                    placeholder="e.g., Pet Expenses"
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
                    disabled={!!editingBudget}
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Icon (Emoji)</Label>
                  <Input
                    value={formData.customIcon}
                    onChange={(e) => setFormData(prev => ({ ...prev, customIcon: e.target.value }))}
                    placeholder="🐕"
                    maxLength={2}
                    className="bg-slate-800 border-slate-700 text-white text-2xl mt-1 h-12"
                    disabled={!!editingBudget}
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-slate-300 text-sm">Monthly Budget Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="e.g. 500"
                className="bg-slate-800 border-slate-700 text-white text-xl h-14 mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-slate-200 text-sm font-medium">Enable Rollover</p>
                  <p className="text-slate-500 text-xs mt-0.5">Unspent funds carry to next month</p>
                </div>
                <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <Switch
                    checked={formData.rolloverEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rolloverEnabled: checked }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-slate-200 text-sm font-medium">Goal-Based Budget</p>
                  <p className="text-slate-500 text-xs mt-0.5">Allocate to savings goal</p>
                </div>
                <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <Switch
                    checked={formData.isGoalBased}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGoalBased: checked }))}
                  />
                </div>
              </div>

              {formData.isGoalBased && (
                <div>
                  <Label className="text-slate-300">Linked Savings Goal</Label>
                  <MobileSelect
                    value={formData.linkedGoalId}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, linkedGoalId: v }))}
                    options={savingsGoals.map(goal => ({ value: goal.id, label: goal.name, icon: goal.icon || '🎯' }))}
                    placeholder="Select a goal"
                    title="Select Savings Goal"
                    triggerClassName="mt-1"
                  />
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-slate-200 text-sm font-medium">Variable Budget</p>
                  <p className="text-slate-500 text-xs mt-0.5">Based on % of income</p>
                </div>
                <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <Switch
                    checked={formData.isVariable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVariable: checked }))}
                  />
                </div>
              </div>

              {formData.isVariable && (
                <div>
                  <Label className="text-slate-300">Percentage of Income: {formData.variablePercentage}%</Label>
                  <Input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={formData.variablePercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, variablePercentage: parseInt(e.target.value) }))}
                    className="mt-2"
                  />
                  {monthlyIncome > 0 && (
                    <p className="text-cyan-400 text-sm mt-2">
                      = {formatCurrency((monthlyIncome * formData.variablePercentage) / 100)}
                    </p>
                  )}
                </div>
              )}
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
                disabled={!formData.amount || (!formData.category && !formData.customCategory)}
                className="w-full sm:flex-1 min-h-[52px] text-base font-semibold"
              >
                {editingBudget ? 'Update' : 'Create'} Budget
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentPage="Budgets" />
    </SpaceBackground>
  );
}