import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import IOSPicker from '@/components/ui/IOSPicker';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { getCategoryByName } from '@/components/ui/CategoryIcon';
import { convertCurrency } from '@/components/currency/currencyUtils';
import { format } from "date-fns";
import { X, Camera, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = ['USD','QAR','EUR','GBP','EGP','SAR','AED','INR','PKR'].map(c => ({ value: c, label: c }));

const CATEGORIES = [
  { value: 'Food', label: '🍔 Food' },
  { value: 'Groceries', label: '🛒 Groceries' },
  { value: 'Transport', label: '🚗 Transport' },
  { value: 'Shopping', label: '🛍️ Shopping' },
  { value: 'Entertainment', label: '🎮 Entertainment' },
  { value: 'Utilities', label: '💡 Utilities' },
  { value: 'Healthcare', label: '⚕️ Healthcare' },
  { value: 'Other', label: '📌 Other' },
];

const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export default function AddReceiptModal({ onClose, profile }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploadMode, setUploadMode] = useState('select');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    merchant_name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    total_amount_original: '',
    currency_original: profile?.currency || 'USD',
    category: 'Food',
    payment_method: 'card',
    notes: '',
    tags: '',
    create_transaction: true,
  });

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please select an image or PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    setUploadMode('form');
  };

  const createReceiptMutation = useMutation({
    mutationFn: async (data) => {
      let imageUrl = null;
      if (selectedFile) {
        setUploading(true);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
          imageUrl = file_url;
        } catch {
          throw new Error('Failed to upload image');
        } finally {
          setUploading(false);
        }
      }

      let total_amount_base = data.total_amount_original;
      if (data.currency_original !== profile?.currency) {
        const { data: rates = [] } = await base44.entities.FXRate.list();
        total_amount_base = convertCurrency(
          data.total_amount_original,
          data.currency_original,
          profile?.currency || 'USD',
          rates
        );
      }

      const receiptData = {
        ...data,
        total_amount_base,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        has_image: !!imageUrl,
        image_url: imageUrl,
      };
      delete receiptData.create_transaction;

      const receipt = await base44.entities.Receipt.create(receiptData);

      if (data.create_transaction) {
        const cat = getCategoryByName(data.category);
        const transaction = await base44.entities.Transaction.create({
          amount: total_amount_base,
          currency: profile?.currency || 'USD',
          amount_base: total_amount_base,
          category: data.category,
          category_icon: cat.icon,
          type: 'expense',
          date: data.date,
          merchant: data.merchant_name,
          notes: `Receipt: ${data.title}`,
          payment_method: data.payment_method,
          linked_receipt_id: receipt.id,
        });
        await base44.entities.Receipt.update(receipt.id, { linked_transaction_id: transaction.id });
      }

      return receipt;
    },
    onSuccess: (receipt) => {
      queryClient.invalidateQueries(['receipts']);
      queryClient.invalidateQueries(['transactions']);
      toast.success(receipt.linked_transaction_id ? 'Receipt saved and expense logged' : 'Receipt saved to vault');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add receipt');
    },
  });

  const handleSubmit = () => {
    createReceiptMutation.mutate({
      ...formData,
      total_amount_original: parseFloat(formData.total_amount_original),
    });
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        hideClose
        className="bg-slate-950 border-t border-slate-800 rounded-t-3xl flex flex-col"
        style={{ paddingBottom: 0, maxHeight: '95dvh' }}
      >
        {/* Hidden file inputs */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 flex-shrink-0">
          <button onClick={onClose} className="text-slate-400 text-sm min-h-[44px] px-2 active:text-white">Cancel</button>
          <span className="text-white font-semibold text-base">Add Receipt</span>
          <button
            onClick={handleSubmit}
            disabled={!formData.merchant_name || !formData.total_amount_original || createReceiptMutation.isPending || uploading}
            className="text-cyan-400 text-sm font-semibold min-h-[44px] px-2 disabled:opacity-40 active:text-cyan-300"
          >
            {uploading ? 'Uploading…' : createReceiptMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {uploadMode === 'select' ? (
            <div className="px-5 pt-6 space-y-3 pb-8">
              <p className="text-slate-400 text-sm mb-4">Choose how to add your receipt:</p>
              <NeonButton onClick={() => cameraInputRef.current?.click()} variant="purple" className="w-full h-20">
                <Camera className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Take Photo</div>
                  <div className="text-xs opacity-80">Open camera</div>
                </div>
              </NeonButton>
              <NeonButton onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full h-20">
                <Upload className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Upload from Gallery</div>
                  <div className="text-xs opacity-80">Choose photo or PDF</div>
                </div>
              </NeonButton>
              <NeonButton onClick={() => setUploadMode('form')} variant="ghost" className="w-full">
                Skip — Add manually
              </NeonButton>
            </div>
          ) : (
            <div className="px-5 pt-5 space-y-5 pb-8">
              {/* Image preview */}
              {(previewUrl || selectedFile) && (
                <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Receipt" className="w-full h-48 object-contain" />
                  ) : (
                    <div className="flex items-center justify-center h-48 gap-2">
                      <ImageIcon className="w-10 h-10 text-slate-500" />
                      <p className="text-slate-400 text-sm">{selectedFile.name}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute top-3 right-3 p-2 bg-black/60 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {!selectedFile && (
                <div className="flex gap-3">
                  <button onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm">
                    <Camera className="w-4 h-4" /> Camera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </div>
              )}

              {/* Title */}
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Title *</Label>
                <Input value={formData.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g., Carrefour groceries" className="bg-slate-800 border-slate-700 text-white h-14" />
              </div>

              {/* Merchant */}
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Merchant Name *</Label>
                <Input value={formData.merchant_name} onChange={(e) => set('merchant_name', e.target.value)} placeholder="Store name" className="bg-slate-800 border-slate-700 text-white h-14" />
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Amount *</Label>
                  <Input type="number" inputMode="decimal" step="0.01" value={formData.total_amount_original} onChange={(e) => set('total_amount_original', e.target.value)} placeholder="0.00" className="bg-slate-800 border-slate-700 text-white h-14" />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Currency</Label>
                  <IOSPicker value={formData.currency_original} onValueChange={(v) => set('currency_original', v)} title="Select Currency" options={CURRENCIES} triggerClassName="h-14" />
                </div>
              </div>

              {/* Date */}
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Date *</Label>
                <MobileDatePicker value={formData.date} onChange={(v) => set('date', v)} />
              </div>

              {/* Category + Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Category</Label>
                  <IOSPicker value={formData.category} onValueChange={(v) => set('category', v)} title="Category" options={CATEGORIES} triggerClassName="h-14" />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Payment</Label>
                  <IOSPicker value={formData.payment_method} onValueChange={(v) => set('payment_method', v)} title="Payment Method" options={PAYMENT_METHODS} triggerClassName="h-14" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Tags (comma-separated)</Label>
                <Input value={formData.tags} onChange={(e) => set('tags', e.target.value)} placeholder="e.g., grocery, family, travel" className="bg-slate-800 border-slate-700 text-white h-14" />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional details..." rows={3} className="bg-slate-800 border-slate-700 text-white" />
              </div>

              {/* Create transaction toggle */}
              <div className="flex items-center justify-between py-3 border-t border-slate-800">
                <Label className="text-slate-300 text-sm">Create expense transaction</Label>
                <Switch checked={formData.create_transaction} onCheckedChange={(v) => set('create_transaction', v)} />
              </div>
            </div>
          )}
        </div>

        {/* Safe area spacer */}
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} className="flex-shrink-0" />
      </SheetContent>
    </Sheet>
  );
}