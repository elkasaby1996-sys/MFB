import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NeonButton from '@/components/ui/NeonButton';
import ReviewReceiptModal from './ReviewReceiptModal';
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider';

export default function ScanReceiptModal({ onClose, profile }) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Upload receipt mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ imageFile, source }) => {
      setUploading(true);

      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: imageFile
      });

      // Create receipt record with status "uploaded"
      const receipt = await base44.entities.Receipt.create({
        source,
        status: 'uploaded',
        merchant_name: 'Processing...',
        date: format(new Date(), 'yyyy-MM-dd'),
        total_amount_original: 0,
        currency_original: profile?.currency || 'USD',
        has_image: true,
        image_url: file_url
      });

      return { receipt, file_url };
    },
    onSuccess: async ({ receipt, file_url }) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setUploading(false);

      // Start processing in background
      setProcessingReceipt(receipt);

      try {
        // Call backend function to process receipt
        await base44.functions.invoke('processReceipt', {
          receiptId: receipt.id,
          imageUrl: file_url
        });

        // Refresh receipts to get updated data
        const updatedReceipts = await base44.entities.Receipt.list('-created_date', 100);
        queryClient.setQueryData(['receipts'], updatedReceipts);

        // Find the updated receipt
        const updatedReceipt = updatedReceipts.find((r) => r.id === receipt.id);

        if (updatedReceipt) {
            // Always require explicit user review before posting any expense
          setProcessingReceipt(null);

          if (updatedReceipt) {
            setShowReviewModal(true);
            setProcessingReceipt(updatedReceipt);
          }
        }
      } catch (error) {
        console.error('Processing error:', error);
        toast.error('Receipt saved but processing failed. Please review manually.');
        setProcessingReceipt(null);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload receipt');
      setUploading(false);
    }
  });

  const handleFileSelect = (event, source) => {
    if (!isOnline) {
      toast.error("You're offline. Connect to the internet to scan receipts.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload
      uploadMutation.mutate({ imageFile: file, source });
    }
  };

  return (
    <>
      <Dialog open={!showReviewModal} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogTitle className="sr-only">Scan Receipt</DialogTitle>
          <DialogDescription className="sr-only">Upload or take a photo of your receipt to extract transaction details.</DialogDescription>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Scan Receipt</h2>
              <button
                onClick={onClose}
                aria-label="Close receipt scanner"
                className="text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview or Upload Options */}
            {capturedImage ?
            <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <img
                  src={capturedImage}
                  alt="Receipt preview"
                  className="w-full max-h-96 object-contain bg-slate-950" />

                </div>
                {(uploading || processingReceipt) &&
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      {uploading ? 'Uploading...' : 'Extracting receipt details...'}
                    </span>
                  </div>
              }
              </div> :

            <div className="space-y-3">
                <p className="text-slate-400 text-sm text-center mb-4">
                  Take a clear photo of your receipt or upload an existing image
                </p>

                <NeonButton
                onClick={() => cameraInputRef.current?.click()}
                variant="purple"
                className="w-full"
                disabled={!isOnline}>

                  <Camera className="w-5 h-5" />
                  {!isOnline ? 'Offline' : 'Take Photo'}
                </NeonButton>

                <NeonButton
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="w-full"
                disabled={!isOnline}>

                  <Upload className="w-5 h-5" />
                  {!isOnline ? 'Offline' : 'Upload from Library'}
                </NeonButton>
                
                {!isOnline &&
              <p className="text-orange-400 text-xs text-center">
                    You're offline. Receipt scanning requires an internet connection.
                  </p>
              }

                {/* Hidden file inputs */}
                <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileSelect(e, 'camera')}
                className="hidden" />

                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'library')}
                className="hidden" />

              </div>
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      {showReviewModal && processingReceipt &&
      <ReviewReceiptModal
        receipt={processingReceipt}
        profile={profile}
        onClose={() => {
          setShowReviewModal(false);
          setProcessingReceipt(null);
          onClose();
        }} />

      }
    </>);

}