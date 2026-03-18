import React, { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from '@/components/sidehustle/OverviewTab';
import ClientsTab from '@/components/sidehustle/ClientsTab';
import InvoicesTab from '@/components/sidehustle/InvoicesTab';
import TransactionsTab from '@/components/sidehustle/TransactionsTab';
import AICoach from '@/components/sidehustle/AICoach';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { usePremium } from '@/components/providers/PremiumProvider';
import PaywallGate from '@/components/subscription/PaywallGate';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Lock, Briefcase } from "lucide-react";
import { startOfYear, startOfMonth, endOfMonth, format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from "sonner";

export default function SideHustle() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isElite } = usePremium();

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: clients = [] } = useQuery({
    queryKey: ['sideHustleClients'],
    queryFn: () => base44.entities.SideHustleClient.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['sideHustleInvoices'],
    queryFn: () => base44.entities.SideHustleInvoice.list('-issue_date'),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['sideHustleTransactions'],
    queryFn: () => base44.entities.SideHustleTransaction.list('-date'),
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.SideHustleClient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sideHustleClients']);
      toast.success('Client added');
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.SideHustleClient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sideHustleClients']);
      toast.success('Client deleted');
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.SideHustleInvoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sideHustleInvoices']);
      toast.success('Invoice created');
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SideHustleInvoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sideHustleInvoices']);
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.SideHustleTransaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sideHustleTransactions']);
      toast.success('Transaction added');
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id) => base44.entities.SideHustleTransaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sideHustleTransactions']);
      toast.success('Transaction deleted');
    },
  });

  const currency = profile?.currency || 'USD';

  // Calculate this month stats
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Calculate YTD stats
  const yearStart = startOfYear(new Date());
  const ytdTransactions = transactions.filter(t => new Date(t.date) >= yearStart);
  const ytdIncome = ytdTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const ytdExpenses = ytdTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Calculate monthly profit for chart (last 12 months)
  const monthlyProfit = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const monthTxns = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    });

    const income = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    monthlyProfit.push({
      month: format(date, 'MMM'),
      profit: income - expenses,
    });
  }

  // Calculate client revenue
  const clientRevenue = {};
  clients.forEach(client => {
    clientRevenue[client.id] = transactions
      .filter(t => t.type === 'income' && t.client_id === client.id)
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const handleMarkPaid = (invoice) => {
    updateInvoiceMutation.mutate({
      id: invoice.id,
      data: { status: 'paid', paid_date: format(new Date(), 'yyyy-MM-dd') },
    });

    // Create income transaction
    createTransactionMutation.mutate({
      type: 'income',
      category: 'Freelance',
      amount: invoice.amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      description: `Payment for ${invoice.invoice_number}`,
      currency: invoice.currency,
    });

    toast.success('Invoice marked as paid!');
  };

  return (
    <SpaceBackground>
      <SubPageHeader title="Side Hustle" />
      <PaywallGate featureId="side_hustle" requiredTier="elite">
      <main className="pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6 py-4">

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <OverviewTab
                  monthIncome={monthIncome}
                  monthExpenses={monthExpenses}
                  ytdIncome={ytdIncome}
                  ytdExpenses={ytdExpenses}
                  monthlyProfit={monthlyProfit}
                  currency={currency}
                />
              </TabsContent>

              <TabsContent value="clients" className="mt-4">
                <ClientsTab
                  clients={clients}
                  onAddClient={(data) => createClientMutation.mutate(data)}
                  onDeleteClient={(id) => deleteClientMutation.mutate(id)}
                  clientRevenue={clientRevenue}
                  currency={currency}
                />
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                <InvoicesTab
                  invoices={invoices}
                  clients={clients}
                  onAddInvoice={(data) => createInvoiceMutation.mutate(data)}
                  onMarkPaid={handleMarkPaid}
                  currency={currency}
                />
              </TabsContent>

              <TabsContent value="transactions" className="mt-4">
                <TransactionsTab
                  transactions={transactions}
                  clients={clients}
                  onAdd={(data) => createTransactionMutation.mutate(data)}
                  onDelete={(id) => deleteTransactionMutation.mutate(id)}
                  currency={currency}
                />
              </TabsContent>


            </Tabs>
          </motion.div>
        </div>
      </main>
      </PaywallGate>

      <BottomNav currentPage="SideHustle" />
    </SpaceBackground>
  );
}