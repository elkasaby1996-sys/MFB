import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import { Camera, Upload, X, Sparkles, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function ReceiptScanner({ onTransactionExtracted, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    await processFile(file);
  };

  const processFile = async (file) => {
    setUploading(true);
    setError(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setUploading(false);
      setExtracting(true);

      // Extract transaction data
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "Total amount on receipt" },
            merchant: { type: "string", description: "Store or merchant name" },
            date: { type: "string", description: "Transaction date in YYYY-MM-DD format" },
            category: { type: "string", description: "Category like Food, Shopping, Entertainment, etc" },
            items: { 
              type: "array",
              description: "Individual items purchased",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" }
                }
              }
            }
          }
        }
      });

      setExtracting(false);

      if (result.status === 'success' && result.output) {
        const data = result.output;
        onTransactionExtracted({
          amount: data.amount?.toString() || '',
          merchant: data.merchant || '',
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'Food',
          notes: data.items?.map(i => `${i.name}: $${i.price}`).join(', ') || '',
        });
      } else {
        setError(result.details || 'Could not extract data from receipt');
      }
    } catch (err) {
      setError('Failed to process receipt. Please try again.');
      setUploading(false);
      setExtracting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <NeonCard className="p-6" glowColor="purple">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Scan Receipt</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!preview ? (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  capture="user"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <NeonButton
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-16"
                  variant="purple"
                >
                  <Camera className="w-6 h-6" />
                  Take Photo
                </NeonButton>

                <NeonButton
                  onClick={() => {
                    fileInputRef.current?.removeAttribute('capture');
                    fileInputRef.current?.click();
                  }}
                  className="w-full h-16"
                  variant="secondary"
                >
                  <Upload className="w-6 h-6" />
                  Upload Image
                </NeonButton>

                <p className="text-slate-400 text-sm text-center">
                  Supported: JPG, PNG, PDF
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-xl overflow-hidden bg-slate-800">
                  <img src={preview} alt="Receipt preview" className="w-full h-64 object-contain" />
                  {(uploading || extracting) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-white font-medium">
                          {uploading ? 'Uploading...' : 'Extracting data...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <NeonButton
                    variant="ghost"
                    onClick={() => {
                      setPreview(null);
                      setError(null);
                    }}
                    className="flex-1"
                  >
                    Try Again
                  </NeonButton>
                </div>
              </div>
            )}
          </NeonCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}