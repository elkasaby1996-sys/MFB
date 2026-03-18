import React, { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GivingOverview from '@/components/charity/GivingOverview';
import GivingGoals from '@/components/charity/GivingGoals';
import DonationLog from '@/components/charity/DonationLog';
import GivingCharts from '@/components/charity/GivingCharts';
import AIGivingCoach from '@/components/charity/AIGivingCoach';
import { Heart } from "lucide-react";
import { startOfYear, startOfMonth, endOfMonth, format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from "sonner";

export default function Charity() {
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-date'),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['givingGoals'],
    queryFn: () => base44.entities.GivingGoal.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const createDonationMutation = useMutation({
    mutationFn: (data) => base44.entities.Donation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['donations']);
      toast.success('Donation logged');
    },
  });

  const deleteDonationMutation = useMutation({
    mutationFn: (id) => base44.entities.Donation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['donations']);
      toast.success('Donation deleted');
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.GivingGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['givingGoals']);
      toast.success('Goal created');
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.GivingGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['givingGoals']);
      toast.success('Goal deleted');
    },
  });

  const currency = profile?.currency || 'USD';
  const expatMode = profile?.expat_mode || false;

  // Calculate month and year totals
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const yearStart = startOfYear(new Date());

  const monthDonations = donations.filter(d => {
    const date = new Date(d.date);
    return date >= monthStart && date <= monthEnd;
  });

  const yearDonations = donations.filter(d => {
    const date = new Date(d.date);
    return date >= yearStart;
  });

  const monthTotal = monthDonations.reduce((sum, d) => sum + (d.amount_base || d.amount), 0);
  const yearTotal = yearDonations.reduce((sum, d) => sum + (d.amount_base || d.amount), 0);

  // Calculate % of income
  const yearIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date) >= yearStart)
    .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);
  
  const percentOfIncome = yearIncome > 0 ? (yearTotal / yearIncome) * 100 : 0;

  // Calculate goal progress
  const currentProgress = {};
  goals.forEach(goal => {
    const categoryDonations = goal.category_focus === 'all' 
      ? donations 
      : donations.filter(d => d.category === goal.category_focus);

    let current = 0;
    let target = 0;

    if (goal.goal_type === 'monthly_fixed') {
      const monthDonations = categoryDonations.filter(d => {
        const date = new Date(d.date);
        return date >= monthStart && date <= monthEnd;
      });
      current = monthDonations.reduce((sum, d) => sum + (d.amount_base || d.amount), 0);
      target = goal.target_amount || 0;
    } else if (goal.goal_type === 'yearly_fixed') {
      const yearDonations = categoryDonations.filter(d => {
        const date = new Date(d.date);
        return date >= yearStart;
      });
      current = yearDonations.reduce((sum, d) => sum + (d.amount_base || d.amount), 0);
      target = goal.target_amount || 0;
    } else if (goal.goal_type === 'monthly_percent') {
      const monthIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + (t.amount_base || t.amount), 0);
      const monthGiven = categoryDonations
        .filter(d => new Date(d.date) >= monthStart && new Date(d.date) <= monthEnd)
        .reduce((sum, d) => sum + (d.amount_base || d.amount), 0);
      current = monthIncome > 0 ? (monthGiven / monthIncome) * 100 : 0;
      target = goal.target_percent || 0;
    } else if (goal.goal_type === 'yearly_percent') {
      const yearGiven = categoryDonations
        .filter(d => new Date(d.date) >= yearStart)
        .reduce((sum, d) => sum + (d.amount_base || d.amount), 0);
      current = yearIncome > 0 ? (yearGiven / yearIncome) * 100 : 0;
      target = goal.target_percent || 0;
    }

    currentProgress[goal.id] = { current, target };
  });

  // Prepare chart data
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const monthDonations = donations.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= start && dDate <= end;
    });

    monthlyData.push({
      month: format(date, 'MMM'),
      amount: monthDonations.reduce((sum, d) => sum + (d.amount_base || d.amount), 0),
    });
  }

  const categoryData = [
    { category: 'charity', name: 'Charity', value: 0 },
    { category: 'family_support', name: 'Family Support', value: 0 },
    { category: 'community', name: 'Community', value: 0 },
    { category: 'religious', name: 'Religious', value: 0 },
    { category: 'other', name: 'Other', value: 0 },
  ];

  yearDonations.forEach(d => {
    const cat = categoryData.find(c => c.category === d.category);
    if (cat) cat.value += (d.amount_base || d.amount);
  });

  const filteredCategoryData = categoryData.filter(c => c.value > 0);

  return (
    <SpaceBackground>
      <SubPageHeader title="Charity & Giving" />
      <main className="pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-4 py-4">

          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GivingOverview
              monthTotal={monthTotal}
              yearTotal={yearTotal}
              percentOfIncome={percentOfIncome}
              currency={currency}
            />
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="donations" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="donations">Donations</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="donations" className="mt-4">
                <DonationLog
                  donations={donations}
                  onAdd={(data) => createDonationMutation.mutate(data)}
                  onDelete={(id) => deleteDonationMutation.mutate(id)}
                  baseCurrency={currency}
                  expatMode={expatMode}
                  fxRates={[]}
                />
              </TabsContent>

              <TabsContent value="goals" className="mt-4">
                <GivingGoals
                  goals={goals.filter(g => g.is_active)}
                  currentProgress={currentProgress}
                  onAdd={(data) => createGoalMutation.mutate(data)}
                  onDelete={(id) => deleteGoalMutation.mutate(id)}
                  currency={currency}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                <GivingCharts
                  monthlyData={monthlyData}
                  categoryData={filteredCategoryData}
                  currency={currency}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <BottomNav currentPage="Charity" />
    </SpaceBackground>
  );
}