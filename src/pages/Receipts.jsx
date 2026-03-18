import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import ReceiptCard from '@/components/receipts/ReceiptCard';
import AddReceiptModal from '@/components/receipts/AddReceiptModal';
import ScanReceiptModal from '@/components/receipts/ScanReceiptModal';
import ReceiptDetailModal from '@/components/receipts/ReceiptDetailModal';
import ReceiptFilters from '@/components/receipts/ReceiptFilters';
import AIReceiptAnalyzer from '@/components/receipts/AIReceiptAnalyzer';
import { formatCurrency } from '@/components/currency/currencyUtils';
import { usePremium } from '@/components/providers/PremiumProvider';
import QueryWrapper from '@/components/ui/QueryWrapper';
import { 
  Vault,
  Plus, 
  ScanLine, 
  Crown, 
  FileText,
  Receipt as ReceiptIcon,
  TrendingUp,
  Store,
  Sparkles
} from "lucide-react";
import SubPageHeader from '@/components/layout/SubPageHeader';
import PaywallGate from '@/components/subscription/PaywallGate';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function Receipts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [reviewReceiptId, setReviewReceiptId] = useState(null);
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateRange: null,
    category: null,
    merchant: null,
    hasImage: null,
    status: null,
    tags: [],
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => base44.entities.Receipt.list('-created_date', 100),
  });

  // Clean up stuck receipts on mount
  React.useEffect(() => {
    const cleanupStuckReceipts = async () => {
      if (!receipts || receipts.length === 0) return;
      
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const stuckReceipts = receipts.filter(r => 
        r.status === 'processing' && 
        r.processing_started_at && 
        new Date(r.processing_started_at) < twoMinutesAgo
      );

      if (stuckReceipts.length > 0) {
        // Cleaning up stuck receipts
        
        for (const receipt of stuckReceipts) {
          try {
            await base44.entities.Receipt.update(receipt.id, {
              status: 'failed',
              processing_finished_at: new Date().toISOString(),
              processing_error: 'Processing stalled. Tap Retry.',
            });
          } catch (error) {
            // cleanup error ignored
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ['receipts'] });
        toast.info(`${stuckReceipts.length} stuck receipt(s) marked for retry`);
      }
    };

    const timer = setTimeout(cleanupStuckReceipts, 1000);
    return () => clearTimeout(timer);
  }, [receipts, queryClient]);

  // Auto-open review modal for newly processed receipts
  React.useEffect(() => {
    if (!receipts || receipts.length === 0) return;
    
    // Check if there's a receipt that just became needs_review
    const newReviewReceipts = receipts.filter(r => 
      r.status === 'needs_review' && 
      !r.linked_transaction_id &&
      r.processing_finished_at &&
      (Date.now() - new Date(r.processing_finished_at).getTime()) < 5000 // Within last 5 seconds
    );

    if (newReviewReceipts.length > 0 && !selectedReceipt && !reviewReceiptId) {
      // Auto-open the most recent one
      setReviewReceiptId(newReviewReceipts[0].id);
    }
  }, [receipts, selectedReceipt, reviewReceiptId]);

  // Retry processing handler
  const handleRetryProcessing = async (receipt) => {
    if (!receipt.image_url) {
      toast.error('Cannot retry - receipt has no image');
      return;
    }

    try {
      // Reset status to processing
      await base44.entities.Receipt.update(receipt.id, {
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        processing_error: null,
        processing_finished_at: null,
      });

      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Retrying receipt processing...');

      // Call backend function
      await base44.functions.invoke('processReceipt', {
        receiptId: receipt.id,
        imageUrl: receipt.image_url,
      });

      // Refresh receipts
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    } catch (error) {
      toast.error('Failed to retry processing');
      
      // Mark as failed again
      await base44.entities.Receipt.update(receipt.id, {
        status: 'failed',
        processing_finished_at: new Date().toISOString(),
        processing_error: error.message || 'Retry failed',
      });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    }
  };

  const { isPremium, currentTier, isElite, isPro, isProOrElite } = usePremium();

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthReceipts = receipts.filter(r => {
      const receiptDate = new Date(r.date);
      return receiptDate >= monthStart && receiptDate <= monthEnd;
    });

    const totalAmount = thisMonthReceipts.reduce((sum, r) => sum + (r.total_amount_base || 0), 0);

    // Find top merchant
    const merchantTotals = {};
    thisMonthReceipts.forEach(r => {
      const merchant = r.merchant_name || 'Unknown';
      merchantTotals[merchant] = (merchantTotals[merchant] || 0) + (r.total_amount_base || 0);
    });
    const topMerchant = Object.keys(merchantTotals).reduce((a, b) => 
      merchantTotals[a] > merchantTotals[b] ? a : b, 'None'
    );

    return {
      count: thisMonthReceipts.length,
      totalAmount,
      topMerchant: thisMonthReceipts.length > 0 ? topMerchant : 'None',
    };
  }, [receipts]);

  // Filter and search receipts
  const filteredReceipts = useMemo(() => {
    let result = [...receipts];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => {
        const searchableText = [
          r.title,
          r.merchant_name,
          r.category,
          r.notes,
          r.ocr_raw_text,
          ...(r.tags || [])
        ].join(' ').toLowerCase();
        
        return searchableText.includes(query);
      });
    }

    // Filters
    if (filters.category) {
      result = result.filter(r => r.category === filters.category);
    }
    if (filters.merchant) {
      result = result.filter(r => r.merchant_name === filters.merchant);
    }
    if (filters.hasImage !== null) {
      result = result.filter(r => r.has_image === filters.hasImage);
    }
    if (filters.status) {
      result = result.filter(r => r.status === filters.status);
    }
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(r => {
        const receiptTags = r.tags || [];
        return filters.tags.some(tag => receiptTags.includes(tag));
      });
    }
    if (filters.dateRange) {
      result = result.filter(r => {
        const receiptDate = new Date(r.date);
        return receiptDate >= filters.dateRange.start && receiptDate <= filters.dateRange.end;
      });
    }

    return result;
  }, [receipts, searchQuery, filters]);

  // Get unique merchants and tags for filters
  const uniqueMerchants = useMemo(() => {
    return [...new Set(receipts.map(r => r.merchant_name).filter(Boolean))];
  }, [receipts]);

  const uniqueTags = useMemo(() => {
    const allTags = receipts.flatMap(r => r.tags || []);
    return [...new Set(allTags)];
  }, [receipts]);

  return (
    <SpaceBackground>
      <SubPageHeader title="Smart Receipts Vault" />
      <PaywallGate featureId="receipt_scanner" requiredTier="pro">
      <main className="pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-4 py-4">

          {/* Monthly Summary */}
          <NeonCard className="p-4" glowColor="cyan">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ReceiptIcon className="w-4 h-4 text-cyan-400" />
                  <p className="text-slate-400 text-xs">This Month</p>
                </div>
                <p className="text-white font-bold text-lg">{monthlyStats.count}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <p className="text-slate-400 text-xs">Total</p>
                </div>
                <p className="text-white font-bold text-lg">
                  {formatCurrency(monthlyStats.totalAmount, profile?.currency || 'USD')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-purple-400" />
                  <p className="text-slate-400 text-xs">Top Store</p>
                </div>
                <p className="text-white font-semibold text-sm truncate">
                  {monthlyStats.topMerchant}
                </p>
              </div>
            </div>
          </NeonCard>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <NeonButton
              onClick={() => setShowScanModal(true)}
              variant="purple"
            >
              <ScanLine className="w-5 h-5" />
              Scan Receipt
            </NeonButton>
            <NeonButton
              onClick={() => setShowAddModal(true)}
              variant="secondary"
            >
              <Plus className="w-5 h-5" />
              Add Manual
            </NeonButton>
          </div>

          {/* AI Analyzer Button (Pro+ only) */}
          {isProOrElite && receipts.length > 0 && (
            <NeonButton
              onClick={() => setShowAIAnalyzer(true)}
              variant="purple"
              className="w-full"
            >
              <Sparkles className="w-5 h-5" />
              Analyze my receipts with AI
            </NeonButton>
          )}

          {/* Search & Filters */}
          <ReceiptFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            merchants={uniqueMerchants}
            tags={uniqueTags}
          />

          {/* Receipts List */}
          <QueryWrapper
            isLoading={isLoading}
            error={error}
            data={filteredReceipts}
            emptyMessage={receipts.length === 0 ? "No receipts yet. Scan your first receipt!" : "No receipts match your search"}
          >
            <div className="space-y-3">
              {filteredReceipts.map((receipt, index) => (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ReceiptCard
                    receipt={receipt}
                    baseCurrency={profile?.currency || 'USD'}
                    onClick={() => {
                      if (receipt.status === 'needs_review') {
                        setReviewReceiptId(receipt.id);
                      } else {
                        setSelectedReceipt(receipt);
                      }
                    }}
                    onRetry={handleRetryProcessing}
                  />
                </motion.div>
              ))}
            </div>
          </QueryWrapper>
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddReceiptModal
          onClose={() => setShowAddModal(false)}
          profile={profile}
        />
      )}

      {showScanModal && (
        <ScanReceiptModal
          onClose={() => setShowScanModal(false)}
          profile={profile}
        />
      )}

      {selectedReceipt && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          profile={profile}
        />
      )}

      {reviewReceiptId && (
        <ReceiptDetailModal
          receipt={receipts.find(r => r.id === reviewReceiptId)}
          onClose={() => setReviewReceiptId(null)}
          profile={profile}
        />
      )}

      {showAIAnalyzer && isProOrElite && (
        <AIReceiptAnalyzer
          receipts={receipts}
          profile={profile}
          onClose={() => setShowAIAnalyzer(false)}
        />
      )}

      </PaywallGate>
      <BottomNav currentPage="Receipts" />
    </SpaceBackground>
  );
}