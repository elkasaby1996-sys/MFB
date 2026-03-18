import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import CategoryIcon, { getCategoryByName } from '@/components/ui/CategoryIcon';
import { Input } from "@/components/ui/input";
import { Camera, Upload, FileText, Sparkles, Lock, Crown, CheckCircle } from "lucide-react";
import { usePremium } from '@/components/providers/PremiumProvider';
import { motion } from 'framer-motion';

export default function UploadScan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setExtractedData(null);
      setPreview(null);
    },
  });

  const { isPremium, currentTier, isElite, isPro, isProOrElite } = usePremium();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isProOrElite) {
      navigate(createPageUrl('Settings') + '?showPlans=true');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    await processFile(file);
  };

  const processFile = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setUploading(false);
      setExtracting(true);

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "Total amount" },
            merchant: { type: "string", description: "Merchant name" },
            date: { type: "string", description: "Date YYYY-MM-DD" },
            category: { type: "string", description: "Category: Food, Shopping, Entertainment, Transport, etc" },
            items: { 
              type: "array",
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
        setExtractedData(result.output);
      } else {
        setError(result.details || 'Could not extract data');
      }
    } catch (err) {
      setError('Failed to process receipt');
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!extractedData) return;

    const cat = getCategoryByName(extractedData.category || 'Food');
    await createTransactionMutation.mutateAsync({
      amount: extractedData.amount,
      category: extractedData.category || 'Food',
      category_icon: cat.icon,
      type: 'expense',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      merchant: extractedData.merchant || '',
      payment_method: 'card',
      notes: extractedData.items?.map(i => `${i.name}: $${i.price}`).join(', ') || '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: profile?.currency || 'USD',
    }).format(amount || 0);
  };

  return (
    <SpaceBackground>
      <main className="pb-24 px-4 pt-safe">
        <div className="max-w-lg mx-auto space-y-4 py-4">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Upload & Scan</h1>
            </div>
            <p className="text-slate-400">Upload receipts for automatic expense logging</p>
          </div>

          {!isProOrElite && (
            <NeonCard className="p-5 text-center" glowColor="amber">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <h3 className="text-white font-bold mb-2">Pro+ Feature</h3>
              <p className="text-slate-400 text-sm mb-4">
                Unlock unlimited receipt scanning with OCR
              </p>
              <NeonButton 
                variant="purple"
                onClick={() => navigate(createPageUrl('Settings') + '?showPlans=true')}
              >
                <Crown className="w-5 h-5" />
                Upgrade to Pro+
              </NeonButton>
            </NeonCard>
          )}

          {/* Upload Section */}
          {isProOrElite && !preview && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                capture="environment"
              />
              
              <NeonButton
                onClick={() => {
                  fileInputRef.current?.setAttribute('capture', 'environment');
                  fileInputRef.current?.click();
                }}
                className="w-full h-20"
                variant="purple"
              >
                <Camera className="w-8 h-8" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">Take Photo</div>
                  <div className="text-xs opacity-80">Scan receipt with camera</div>
                </div>
              </NeonButton>

              <NeonButton
                onClick={() => {
                  fileInputRef.current?.removeAttribute('capture');
                  fileInputRef.current?.click();
                }}
                className="w-full h-20"
                variant="secondary"
              >
                <Upload className="w-8 h-8" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">Upload Image</div>
                  <div className="text-xs opacity-80">Choose from gallery</div>
                </div>
              </NeonButton>

              <NeonButton
                onClick={() => {
                  fileInputRef.current?.removeAttribute('capture');
                  fileInputRef.current?.setAttribute('accept', 'application/pdf');
                  fileInputRef.current?.click();
                }}
                className="w-full h-20"
                variant="secondary"
              >
                <FileText className="w-8 h-8" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">Upload PDF</div>
                  <div className="text-xs opacity-80">Bank statement or invoice</div>
                </div>
              </NeonButton>
            </div>
          )}

          {/* Processing/Preview */}
          {preview && (
            <NeonCard className="p-5">
              <div className="relative rounded-xl overflow-hidden bg-slate-800 mb-4">
                <img src={preview} alt="Receipt" className="w-full h-64 object-contain" />
                {(uploading || extracting) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-white font-medium">
                        {uploading ? 'Uploading...' : 'Extracting data with AI...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {extractedData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-green-400 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Data Extracted Successfully!</span>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount</span>
                      <span className="text-white font-bold">{formatCurrency(extractedData.amount)}</span>
                    </div>
                    {extractedData.merchant && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Merchant</span>
                        <span className="text-white">{extractedData.merchant}</span>
                      </div>
                    )}
                    {extractedData.date && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date</span>
                        <span className="text-white">{extractedData.date}</span>
                      </div>
                    )}
                    {extractedData.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Category</span>
                        <CategoryIcon category={extractedData.category} size="sm" showLabel />
                      </div>
                    )}
                  </div>

                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-2">Items</p>
                      <div className="space-y-1">
                        {extractedData.items.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-white">{item.name}</span>
                            <span className="text-slate-400">${item.price?.toFixed(2)}</span>
                          </div>
                        ))}
                        {extractedData.items.length > 5 && (
                          <p className="text-slate-500 text-xs mt-2">
                            +{extractedData.items.length - 5} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <NeonButton
                      variant="ghost"
                      onClick={() => {
                        setPreview(null);
                        setExtractedData(null);
                        setError(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </NeonButton>
                    <NeonButton
                      onClick={handleSaveTransaction}
                      loading={createTransactionMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Save Transaction
                    </NeonButton>
                  </div>
                </motion.div>
              )}
            </NeonCard>
          )}

          {/* Info Card */}
          <NeonCard className="p-5">
            <h3 className="text-white font-semibold mb-3">How it works</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Capture</p>
                  <p className="text-slate-400 text-sm">Take a photo or upload receipt/statement</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">AI Extraction</p>
                  <p className="text-slate-400 text-sm">Our AI reads amount, merchant, date & items</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Auto-Save</p>
                  <p className="text-slate-400 text-sm">Review and save to your spending log</p>
                </div>
              </div>
            </div>
          </NeonCard>
        </div>
      </main>

      <BottomNav currentPage="UploadScan" />
    </SpaceBackground>
  );
}