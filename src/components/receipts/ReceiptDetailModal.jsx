import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { formatCurrency } from '@/components/currency/currencyUtils';
import { motion } from 'framer-motion';
import { format } from "date-fns";
import { 
  X, 
  Calendar, 
  Store, 
  CreditCard, 
  Tag, 
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Receipt as ReceiptIcon,
  Building2,
  Scale
} from "lucide-react";
import { toast } from "sonner";

import ReviewReceiptModal from './ReviewReceiptModal';

export default function ReceiptDetailModal({ receipt, onClose, profile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // If receipt needs review, show the review modal instead
  if (receipt.status === 'needs_review') {
    return <ReviewReceiptModal receipt={receipt} onClose={onClose} profile={profile} />;
  }

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Receipt.delete(receipt.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts']);
      toast.success('Receipt deleted');
      onClose();
    },
    onError: () => {
      toast.error('Failed to delete receipt');
    },
  });

  const items = receipt.items_json ? JSON.parse(receipt.items_json) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg my-8"
      >
        <NeonCard className="p-6" glowColor="cyan">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {receipt.category && <CategoryIcon category={receipt.category} size="lg" />}
              <div>
                <h3 className="text-white font-semibold text-lg">{receipt.merchant_name}</h3>
                {receipt.category && <p className="text-slate-400 text-sm">{receipt.category}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Preview */}
          {receipt.has_image && receipt.image_url && (
            <div className="mb-4">
              <img 
                src={receipt.image_url} 
                alt="Receipt" 
                className="w-full rounded-lg border border-slate-700"
              />
            </div>
          )}

          {/* Amount */}
          <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl border border-cyan-500/30">
            <p className="text-slate-400 text-sm mb-1">Total Amount</p>
            <p className="text-white font-bold text-3xl">
              {formatCurrency(receipt.total_amount_base || receipt.total_amount_original, profile?.currency || 'USD')}
            </p>
            {receipt.currency_original !== profile?.currency && (
              <p className="text-slate-500 text-sm mt-1">
                Original: {receipt.currency_original} {receipt.total_amount_original?.toFixed(2)}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 text-xs">Date</p>
                <p className="text-white text-sm">
                  {format(new Date(receipt.date), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 text-xs">Payment Method</p>
                <p className="text-white text-sm capitalize">
                  {receipt.payment_method || 'Not specified'}
                </p>
              </div>
            </div>

            {receipt.tags && receipt.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <p className="text-slate-500 text-xs mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {receipt.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {receipt.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <p className="text-slate-500 text-xs">Notes</p>
                  <p className="text-white text-sm">{receipt.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          {items && items.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-400 text-sm font-semibold mb-2 flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4" />
                Receipt Items
              </p>
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-slate-400 text-sm">
                      {formatCurrency(item.price, receipt.currency_original)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-3 mb-6">
            {receipt.is_tax_relevant && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Scale className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Tax-relevant</span>
              </div>
            )}
            {receipt.is_business_expense && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm">Business</span>
              </div>
            )}
          </div>

          {/* Linked Transaction */}
          {receipt.transaction_id && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Linked to transaction</span>
                </div>
                <button
                  onClick={() => navigate(createPageUrl('SpendingLog'))}
                  aria-label="View transaction in spending log"
                  className="text-cyan-400 text-xs hover:underline"
                >
                  View in Spending Log
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <NeonButton
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              className="flex-1"
            >
              <Trash2 className="w-5 h-5" />
              Delete Receipt
            </NeonButton>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm"
              >
                <NeonCard className="p-6" glowColor="pink">
                  <h4 className="text-white font-semibold text-lg mb-2">Delete Receipt?</h4>
                  <p className="text-slate-400 text-sm mb-6">
                    This will permanently delete this receipt. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <NeonButton
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="ghost"
                      className="flex-1"
                    >
                      Cancel
                    </NeonButton>
                    <NeonButton
                      onClick={() => deleteMutation.mutate()}
                      loading={deleteMutation.isPending}
                      variant="danger"
                      className="flex-1"
                    >
                      Delete
                    </NeonButton>
                  </div>
                </NeonCard>
              </motion.div>
            </div>
          )}
        </NeonCard>
      </motion.div>
    </div>
  );
}