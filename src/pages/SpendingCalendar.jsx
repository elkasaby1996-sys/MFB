import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import PaywallGate from '@/components/subscription/PaywallGate';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SpendingCalendar() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addExpenseData, setAddExpenseData] = useState({
    amount: '',
    category: 'Food',
    category_icon: '🍔',
    merchant: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setShowAddModal(false);
      toast.success('Expense added');
    },
  });

  const currency = profile?.currency || 'USD';
  const dailyLimit = profile?.daily_spending_limit || 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate spending per day
  const getDaySpending = (day) => {
    return transactions
      .filter(t => t.type === 'expense' && isSameDay(parseISO(t.date), day))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const getDayStatus = (day, spent) => {
    if (!dailyLimit || dailyLimit === 0) {
      return spent > 0 ? { color: 'grey', label: 'No limit set' } : { color: 'grey', label: 'No data' };
    }
    
    const percentage = (spent / dailyLimit) * 100;
    
    if (spent === 0) {
      return { color: 'grey', label: 'No expenses' };
    } else if (percentage >= 100) {
      return { color: 'red', label: 'Over limit' };
    } else if (percentage >= 80) {
      return { color: 'yellow', label: 'Near limit' };
    } else {
      return { color: 'green', label: 'Under limit' };
    }
  };

  // Stats for the month
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dayStatuses = monthDays.map(day => {
    const spent = getDaySpending(day);
    return getDayStatus(day, spent);
  });

  const greenDays = dayStatuses.filter(s => s.color === 'green').length;
  const redDays = dayStatuses.filter(s => s.color === 'red').length;
  
  // Best streak calculation
  let currentStreak = 0;
  let bestStreak = 0;
  dayStatuses.forEach(status => {
    if (status.color === 'green') {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleAddExpense = () => {
    createTransactionMutation.mutate({
      ...addExpenseData,
      amount: parseFloat(addExpenseData.amount),
      type: 'expense',
    });
  };

  const selectedDayTransactions = selectedDay
    ? transactions.filter(t => t.type === 'expense' && isSameDay(parseISO(t.date), selectedDay))
    : [];
  const selectedDaySpent = selectedDay ? getDaySpending(selectedDay) : 0;
  const selectedDayStatus = selectedDay ? getDayStatus(selectedDay, selectedDaySpent) : null;

  return (
    <SpaceBackground>
      <PaywallGate featureId="spending_calendar" requiredTier="pro">
      <main className="pb-24 px-4 pt-safe">
        <div className="max-w-lg mx-auto space-y-4 py-4">
          
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CalendarIcon className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Spending Calendar</h1>
            </div>
            <p className="text-slate-400 text-sm">Track your daily spending patterns</p>
          </div>

          {/* Month Stats */}
          <div className="grid grid-cols-3 gap-3">
            <NeonCard className="p-3 text-center" glowColor="green">
              <p className="text-green-400 text-2xl font-bold">{greenDays}</p>
              <p className="text-slate-400 text-xs">Green Days</p>
            </NeonCard>
            <NeonCard className="p-3 text-center" glowColor="pink">
              <p className="text-red-400 text-2xl font-bold">{redDays}</p>
              <p className="text-slate-400 text-xs">Red Days</p>
            </NeonCard>
            <NeonCard className="p-3 text-center" glowColor="cyan">
              <p className="text-cyan-400 text-2xl font-bold">{bestStreak}</p>
              <p className="text-slate-400 text-xs">Best Streak</p>
            </NeonCard>
          </div>

          {/* Calendar */}
          <NeonCard className="p-5" glowColor="purple">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-800/50 text-cyan-400 hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-white font-bold text-lg">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-800/50 text-cyan-400 hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-slate-400 text-xs font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const spent = getDaySpending(day);
                const status = getDayStatus(day, spent);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                const bgColors = {
                  green: 'bg-green-500/20 border-green-500/40',
                  yellow: 'bg-yellow-500/20 border-yellow-500/40',
                  red: 'bg-red-500 border-red-600',
                  grey: 'bg-slate-800/50 border-slate-700/50',
                };

                return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      aspect-square p-2 rounded-xl transition-all border
                      ${isCurrentMonth ? bgColors[status.color] : 'bg-slate-900/30 border-slate-800/50'}
                      ${isSelected ? 'ring-2 ring-cyan-400' : ''}
                      ${isToday ? 'ring-1 ring-purple-500' : ''}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-sm font-medium ${isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-xs mb-3">Legend:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-300">Under limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-slate-300">Near limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-slate-300">Over limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                  <span className="text-slate-300">No data</span>
                </div>
              </div>
            </div>
          </NeonCard>

          {/* Selected Day Detail */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <NeonCard className="p-5" glowColor={selectedDayStatus?.color === 'green' ? 'green' : selectedDayStatus?.color === 'red' ? 'pink' : 'cyan'}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{format(selectedDay, 'EEEE, MMMM d')}</h3>
                    <p className={`text-sm ${
                      selectedDayStatus?.color === 'green' ? 'text-green-400' : 
                      selectedDayStatus?.color === 'red' ? 'text-red-400' :
                      selectedDayStatus?.color === 'yellow' ? 'text-yellow-400' :
                      'text-slate-400'
                    }`}>
                      {selectedDayStatus?.label}
                    </p>
                  </div>
                  <NeonButton
                    size="sm"
                    onClick={() => {
                      setAddExpenseData({ ...addExpenseData, date: format(selectedDay, 'yyyy-MM-dd') });
                      setShowAddModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </NeonButton>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs">Spent</p>
                    <p className="text-white font-bold text-lg">{formatCurrency(selectedDaySpent)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs">Daily Limit</p>
                    <p className="text-white font-bold text-lg">{dailyLimit ? formatCurrency(dailyLimit) : 'Not set'}</p>
                  </div>
                </div>

                {dailyLimit > 0 && selectedDaySpent !== 0 && (
                  <div className="mb-4 bg-slate-800/30 rounded-xl p-3">
                    <p className={`text-sm font-medium ${
                      selectedDaySpent < dailyLimit ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedDaySpent < dailyLimit 
                        ? `✓ Under limit by ${formatCurrency(dailyLimit - selectedDaySpent)}`
                        : `⚠ Over limit by ${formatCurrency(selectedDaySpent - dailyLimit)}`
                      }
                    </p>
                  </div>
                )}

                {/* Transactions for this day */}
                {selectedDayTransactions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs mb-2">Transactions:</p>
                    {selectedDayTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{tx.category_icon || '💰'}</span>
                          <div>
                            <p className="text-white text-sm">{tx.merchant || tx.category}</p>
                            <p className="text-slate-500 text-xs">{tx.category}</p>
                          </div>
                        </div>
                        <p className="text-white font-semibold">{formatCurrency(tx.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">No expenses for this day</p>
                  </div>
                )}
              </NeonCard>
            </motion.div>
          )}
        </div>
      </main>

      </PaywallGate>

      {/* Add Expense Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Amount</Label>
              <Input
                type="number"
                value={addExpenseData.amount}
                onChange={(e) => setAddExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-slate-300">Category</Label>
              <Input
                value={addExpenseData.category}
                onChange={(e) => setAddExpenseData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Food, Transport, etc."
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Merchant</Label>
              <Input
                value={addExpenseData.merchant}
                onChange={(e) => setAddExpenseData(prev => ({ ...prev, merchant: e.target.value }))}
                placeholder="Where did you spend?"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Date</Label>
              <Input
                type="date"
                value={addExpenseData.date}
                onChange={(e) => setAddExpenseData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <NeonButton 
              onClick={handleAddExpense}
              loading={createTransactionMutation.isPending}
              disabled={!addExpenseData.amount}
              className="w-full"
              variant="purple"
            >
              Add Expense
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentPage="SpendingCalendar" />
    </SpaceBackground>
  );
}