import React, { useState } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import { jsPDF } from 'jspdf';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportExporter({
  reportType,
  transactions,
  budgets,
  savingsGoals,
  investments,
  profile,
  selectedMonth,
  selectedYear
}) {
  const [isExporting, setIsExporting] = useState(false);
  const currency = profile?.currency || 'USD';

  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const date = reportType === 'monthly' ? selectedMonth : selectedYear;
      const dateRange = reportType === 'monthly' 
        ? { start: startOfMonth(date), end: endOfMonth(date) }
        : { start: startOfYear(date), end: endOfYear(date) };

      // Filter transactions
      const reportTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= dateRange.start && tDate <= dateRange.end;
      });

      const income = reportTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = reportTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netCashFlow = income - expenses;

      // Title
      doc.setFontSize(20);
      doc.text(
        reportType === 'monthly' 
          ? `Monthly Financial Report - ${format(date, 'MMMM yyyy')}`
          : `Annual Financial Report - ${format(date, 'yyyy')}`,
        20, 20
      );

      // Generated date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 30);
      doc.text(`MyFinanceBro - ${profile?.name || 'User'}`, 20, 35);

      // Summary
      doc.setFontSize(14);
      doc.text('Financial Summary', 20, 50);
      
      doc.setFontSize(11);
      doc.text(`Total Income: ${formatMoney(income, currency)}`, 30, 60);
      doc.text(`Total Expenses: ${formatMoney(expenses, currency)}`, 30, 67);
      doc.text(`Net Cash Flow: ${formatMoney(netCashFlow, currency)}`, 30, 74);

      // Category breakdown
      const categoryBreakdown = reportTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});

      const categories = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (categories.length > 0) {
        doc.setFontSize(14);
        doc.text('Top Spending Categories', 20, 90);
        
        doc.setFontSize(10);
        let y = 100;
        categories.forEach(([cat, amount], index) => {
          const percentage = ((amount / expenses) * 100).toFixed(1);
          doc.text(`${index + 1}. ${cat}: ${formatMoney(amount, currency)} (${percentage}%)`, 30, y);
          y += 7;
        });
      }

      // Savings & Investments
      const totalSavings = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
      const totalInvestments = investments.reduce((sum, i) => sum + i.current_value, 0);

      doc.setFontSize(14);
      doc.text('Assets', 20, y + 10);
      
      doc.setFontSize(11);
      doc.text(`Total Savings: ${formatMoney(totalSavings, currency)}`, 30, y + 20);
      doc.text(`Total Investments: ${formatMoney(totalInvestments, currency)}`, 30, y + 27);

      // Save
      const filename = reportType === 'monthly'
        ? `monthly-report-${format(date, 'yyyy-MM')}.pdf`
        : `annual-report-${format(date, 'yyyy')}.pdf`;
      
      doc.save(filename);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const date = reportType === 'monthly' ? selectedMonth : selectedYear;
      const dateRange = reportType === 'monthly' 
        ? { start: startOfMonth(date), end: endOfMonth(date) }
        : { start: startOfYear(date), end: endOfYear(date) };

      // Filter transactions
      const reportTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= dateRange.start && tDate <= dateRange.end;
      });

      // Create CSV content
      const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Notes'];
      const rows = reportTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type,
        t.category,
        t.merchant || '',
        t.amount.toFixed(2),
        (t.notes || '').replace(/,/g, ';')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportType === 'monthly'
        ? `transactions-${format(date, 'yyyy-MM')}.csv`
        : `transactions-${format(date, 'yyyy')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <NeonCard className="p-5" glowColor="cyan">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Export Report</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NeonButton
          variant="secondary"
          onClick={exportToPDF}
          loading={isExporting}
          className="flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </NeonButton>

        <NeonButton
          variant="secondary"
          onClick={exportToCSV}
          loading={isExporting}
          className="flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Export CSV
        </NeonButton>
      </div>

      <p className="text-slate-400 text-xs mt-3 text-center">
        Download detailed financial reports for your records
      </p>
    </NeonCard>
  );
}