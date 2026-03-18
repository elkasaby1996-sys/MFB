import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { formatCurrency } from '@/components/currency/currencyUtils';
import { Receipt, Image as ImageIcon, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, Clock, Bug } from "lucide-react";
import { format } from "date-fns";

export default function ReceiptCard({ receipt, baseCurrency, onClick, onRetry }) {
  const [showDebug, setShowDebug] = useState(false);
  
  const status = receipt?.status || 'uploaded';
  const isFailed = status === 'failed';
  const isNeedsReview = status === 'needs_review';
  const isConfirmed = status === 'confirmed';
  const hasLinkedTransaction = !!receipt.linked_transaction_id;
  
  // Status badge
  const getStatusBadge = () => {
    if (!receipt?.status) return null;
    switch (receipt.status) {
      case 'uploaded':
        return (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Uploaded</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1 text-xs text-cyan-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </div>
        );
      case 'needs_review':
        return (
          <div className="flex items-center gap-1 text-xs text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            <span>Needs Review</span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <NeonCard 
      onClick={onClick}
      className="p-4 cursor-pointer hover:scale-[1.02] transition-transform"
      glowColor={isConfirmed && hasLinkedTransaction ? 'green' : isNeedsReview ? 'cyan' : isFailed ? 'pink' : 'teal'}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <Receipt className="w-5 h-5 text-cyan-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">
                {receipt.merchant_name}
              </h3>
              <p className="text-slate-400 text-sm">
                {format(new Date(receipt.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">
                {formatCurrency(receipt.total_amount_base || receipt.total_amount_original, baseCurrency)}
              </p>
              {receipt.category && (
                <p className="text-xs text-slate-400">{receipt.category}</p>
              )}
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {receipt.has_image && (
                <div className="flex items-center gap-1 text-xs text-teal-400">
                  <ImageIcon className="w-3 h-3" />
                  <span>Image</span>
                </div>
              )}
              {hasLinkedTransaction && (
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  <LinkIcon className="w-3 h-3" />
                  <span>Linked</span>
                </div>
              )}
              {receipt.tags && receipt.tags.length > 0 && (
                <div className="flex gap-1">
                  {receipt.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            {isNeedsReview && !hasLinkedTransaction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick && onClick();
                }}
                aria-label="Review receipt"
                className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition-colors active:scale-95"
              >
                Review
              </button>
            )}
            
            {isConfirmed && hasLinkedTransaction && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                Logged
              </span>
            )}
          </div>

          {/* Error message and retry for failed receipts */}
          {isFailed && (
            <div className="mt-2 space-y-2">
              {receipt.processing_error && (
                <p className="text-xs text-red-400">{receipt.processing_error}</p>
              )}
              <div className="flex gap-2">
                {onRetry && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(receipt);
                    }}
                    aria-label="Retry processing receipt"
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors active:scale-95"
                  >
                    Retry Processing
                  </button>
                )}
                {receipt.processing_debug && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDebug(!showDebug);
                    }}
                    aria-label="Show debug information"
                    className="px-2 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs hover:bg-slate-700 transition-colors"
                  >
                    <Bug className="w-3 h-3" />
                  </button>
                )}
              </div>
              {showDebug && receipt.processing_debug && (
                <div className="mt-2 p-2 rounded bg-slate-800/50 text-xs">
                  <pre className="text-slate-400 overflow-auto max-h-32">
                    {JSON.stringify(JSON.parse(receipt.processing_debug), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </NeonCard>
  );
}