import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import { Search, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function ReceiptFilters({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFiltersChange,
  merchants,
  tags 
}) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.status || filters.merchant;

  const clearFilters = () => {
    onFiltersChange({
      dateRange: null,
      category: null,
      merchant: null,
      hasImage: null,
      status: null,
      tags: [],
    });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search receipts, merchants..."
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <NeonButton
          onClick={() => setShowFilters(!showFilters)}
          variant={hasActiveFilters ? "purple" : "secondary"}
          size="icon"
        >
          <Filter className="w-5 h-5" />
        </NeonButton>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <NeonCard className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold text-sm">Filters</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-cyan-400 text-xs hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => onFiltersChange({...filters, status: value === 'all' ? null : value})}
                >
                  <SelectTrigger className="bg-slate-800/50 text-white">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="needs_review">Needs Review</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {merchants.length > 0 && (
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Merchant</label>
                  <Select
                    value={filters.merchant || 'all'}
                    onValueChange={(value) => onFiltersChange({...filters, merchant: value === 'all' ? null : value})}
                  >
                    <SelectTrigger className="bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Merchants</SelectItem>
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant} value={merchant}>
                          {merchant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </NeonCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}