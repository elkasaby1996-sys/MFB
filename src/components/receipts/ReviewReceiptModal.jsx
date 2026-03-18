import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MobileSelect from '@/components/ui/MobileSelect';
import NeonButton from '@/components/ui/NeonButton';
import { AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';
import { PRIMARY_CATEGORIES, HOME_SUBCATEGORIES, validateCategoryStructure } from '@/components/utils/categoryConstants';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReviewReceiptModal({ receipt, onClose, profile }) {
  const queryClient = useQueryClient();
  
  // Parse the parsed_data if available
  const parsedData = receipt.parsed_data ? JSON.parse(receipt.parsed_data) : null;
  
  const [formData, setFormData] = useState({
    merchant_name: receipt.merchant_name || parsedData?.merchantName || '',
    date: receipt.date || parsedData?.date || format(new Date(), 'yyyy-MM-dd'),
    total_amount_original: receipt.total_amount_original || parsedData?.totalAmount || 0,
    currency_original: receipt.currency_original || parsedData?.currency || profile?.currency || 'USD',
    category: receipt.category || parsedData?.suggestedCategory || 'Other (Expense)',
    subCategory: receipt.subCategory || parsedData?.suggestedSubCategory || null,
    payment_method: receipt.payment_method || 'card',
    notes: receipt.notes || '',
  });

  const [errors, setErrors] = useState({});

  // Update subCategory when category changes
  useEffect(() => {
    if (formData.category !== 'Home Expenses') {
      setFormData(prev => ({ ...prev, subCategory: null }));
    }
  }, [formData.category]);

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.merchant_name.trim()) {
      newErrors.merchant_name = 'Merchant name is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.total_amount_original || formData.total_amount_original <= 0) {
      newErrors.total_amount_original = 'Amount must be greater than 0';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Validate category structure
    const categoryValidation = validateCategoryStructure(formData.category, formData.subCategory);
    if (!categoryValidation.valid) {
      newErrors.category = categoryValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) {
        throw new Error('Please fix validation errors');
      }

      // Create transaction
      const transaction = await base44.entities.Transaction.create({
        type: 'expense',
        amount: formData.total_amount_original,
        currency: formData.currency_original,
        category: formData.category,
        subCategory: formData.subCategory,
        date: formData.date,
        merchant: formData.merchant_name,
        payment_method: formData.payment_method,
        notes: formData.notes,
        linked_receipt_id: receipt.id,
      });

      // Update receipt
      await base44.entities.Receipt.update(receipt.id, {
        status: 'confirmed',
        merchant_name: formData.merchant_name,
        date: formData.date,
        total_amount_original: formData.total_amount_original,
        currency_original: formData.currency_original,
        category: formData.category,
        subCategory: formData.subCategory,
        payment_method: formData.payment_method,
        notes: formData.notes,
        linked_transaction_id: transaction.id,
      });

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction created successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create transaction');
    },
  });

  // Save receipt only mutation
  const saveReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) {
        throw new Error('Please fix validation errors');
      }

      await base44.entities.Receipt.update(receipt.id, {
        status: 'confirmed',
        merchant_name: formData.merchant_name,
        date: formData.date,
        total_amount_original: formData.total_amount_original,
        currency_original: formData.currency_original,
        category: formData.category,
        subCategory: formData.subCategory,
        payment_method: formData.payment_method,
        notes: formData.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt saved!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save receipt');
    },
  });

  const confidence = parsedData?.confidence || 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white w-full max-w-full h-[100dvh] sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-2xl flex flex-col p-0 gap-0 m-0 sm:m-auto rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-800 flex-shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)' }}>
          <DialogTitle className="sr-only">Review Receipt</DialogTitle>
          <div>
            <h2 className="text-xl font-bold">Review Receipt</h2>
            {parsedData && (
              <div className="flex items-center gap-2 mt-1">
                {confidence >= 70 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : confidence >= 50 ? (
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-slate-400">
                  {confidence >= 70 ? 'High confidence' : confidence >= 50 ? 'Medium confidence' : 'Low confidence'} — please verify
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Receipt Image Preview */}
          {receipt.image_url && (
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <img
                src={receipt.image_url}
                alt="Receipt"
                className="w-full max-h-64 object-contain bg-slate-950"
              />
            </div>
          )}

          {/* Merchant */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Merchant Name *</Label>
            <Input
              value={formData.merchant_name}
              onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
              placeholder="Store or restaurant name"
              className={`bg-slate-800 border-slate-700 text-white mt-2 h-14 ${errors.merchant_name ? 'border-red-500' : ''}`}
            />
            {errors.merchant_name && (
              <p className="text-red-400 text-xs mt-1">{errors.merchant_name}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`bg-slate-800 border-slate-700 text-white mt-2 h-14 ${errors.date ? 'border-red-500' : ''}`}
            />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Amount */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Amount *</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={formData.total_amount_original}
              onChange={(e) => setFormData({ ...formData, total_amount_original: parseFloat(e.target.value) })}
              placeholder="0.00"
              className={`bg-slate-800 border-slate-700 text-white mt-2 h-14 ${errors.total_amount_original ? 'border-red-500' : ''}`}
            />
            {errors.total_amount_original && (
              <p className="text-red-400 text-xs mt-1">{errors.total_amount_original}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Currency *</Label>
            <MobileSelect
              value={formData.currency_original}
              onValueChange={(value) => setFormData({ ...formData, currency_original: value })}
              options={[
                { value: 'USD', label: 'USD', icon: '🇺🇸' },
                { value: 'QAR', label: 'QAR', icon: '🇶🇦' },
                { value: 'SAR', label: 'SAR', icon: '🇸🇦' },
                { value: 'AED', label: 'AED', icon: '🇦🇪' },
                { value: 'EUR', label: 'EUR', icon: '🇪🇺' },
                { value: 'GBP', label: 'GBP', icon: '🇬🇧' },
              ]}
              title="Select Currency"
              triggerClassName="mt-2"
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Payment Method</Label>
            <MobileSelect
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              options={[
                { value: 'card', label: 'Card', icon: '💳' },
                { value: 'cash', label: 'Cash', icon: '💵' },
                { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
                { value: 'other', label: 'Other', icon: '💰' },
              ]}
              title="Payment Method"
              triggerClassName="mt-2"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Category *</Label>
            <MobileSelect
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              options={PRIMARY_CATEGORIES.map(cat => ({ value: cat.name, label: cat.name, icon: cat.icon }))}
              placeholder="Select category"
              title="Select Category"
              error={!!errors.category}
              triggerClassName="mt-2"
            />
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Sub-Category */}
          {formData.category === 'Home Expenses' && (
            <div>
              <Label className="text-slate-300 text-sm font-medium">Home Sub-Category *</Label>
              <MobileSelect
                value={formData.subCategory || ''}
                onValueChange={(value) => setFormData({ ...formData, subCategory: value })}
                options={HOME_SUBCATEGORIES.map(sub => ({ value: sub.name, label: sub.name, icon: sub.icon }))}
                placeholder="Select sub-category"
                title="Select Home Type"
                triggerClassName="mt-2"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Notes (optional)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional details..."
              className="bg-slate-800 border-slate-700 text-white mt-2 h-14"
            />
          </div>

          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <div className="flex gap-3">
            <NeonButton
              onClick={() => createTransactionMutation.mutate()}
              loading={createTransactionMutation.isPending}
              className="flex-1 min-h-[52px] text-base font-semibold"
              variant="primary"
            >
              Create Transaction
            </NeonButton>
            <NeonButton
              onClick={() => saveReceiptMutation.mutate()}
              loading={saveReceiptMutation.isPending}
              variant="secondary"
              className="min-h-[52px]"
            >
              Save Only
            </NeonButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}