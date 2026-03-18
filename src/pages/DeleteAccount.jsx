import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, AlertTriangle, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: warning, 2: confirm, 3: success
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete my account') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setDeleting(true);
    try {
      // Call server-side deletion — deletes all data AND the auth identity
      const result = await base44.functions.invoke('deleteUserAccount', {});
      
      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Deletion failed on server');
      }

      // Clear local storage
      localStorage.clear();

      setStep(3);
      
      // Sign out and navigate after 3 seconds
      setTimeout(async () => {
        await base44.auth.logout('/');
      }, 3000);
    } catch (error) {
      toast.error('Failed to delete account. Please contact support@myfinancebro.app');
    } finally {
      setDeleting(false);
    }
  };

  if (step === 3) {
    return (
      <SpaceBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <NeonCard className="p-8" glowColor="green">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Deleted</h2>
              <p className="text-slate-400 mb-6">
                Your account identity and all associated data have been permanently and irreversibly deleted from our servers.
              </p>
              <p className="text-slate-500 text-sm">
                Logging out...
              </p>
            </NeonCard>
          </div>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="min-h-screen pb-8" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-3 sticky top-0 bg-slate-950/80 backdrop-blur-lg z-10">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Delete Account</h1>
        </div>

        {/* Content */}
        <div className="px-4">
          <div className="max-w-md mx-auto space-y-6">
            
            {step === 1 && (
              <>
                <NeonCard className="p-6 bg-red-500/10 border-red-500/30">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-bold mb-2">Warning: This Cannot Be Undone</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Deleting your account will permanently remove:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-slate-300 ml-9">
                    <li>• All your transactions and spending history</li>
                    <li>• Budgets and savings goals</li>
                    <li>• Investment tracking data</li>
                    <li>• Debts and subscription records</li>
                    <li>• All receipts and documents</li>
                    <li>• Your profile and settings</li>
                    <li>• All other financial data</li>
                  </ul>

                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                      <span>💡</span>
                      Recommended: Export your data first
                    </p>
                    <p className="text-slate-300 text-xs mt-1">
                      Go to Settings → Data Management → Export Data to download a backup before deleting.
                    </p>
                  </div>
                </NeonCard>

                <div className="flex gap-3">
                  <NeonButton
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton
                    variant="danger"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Continue
                  </NeonButton>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <NeonCard className="p-6">
                  <div className="text-center mb-6">
                    <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">Final Confirmation</h3>
                    <p className="text-slate-400 text-sm">
                      This action is permanent and cannot be reversed.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">
                        Type "DELETE MY ACCOUNT" to confirm
                      </Label>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE MY ACCOUNT"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="flex gap-3">
                      <NeonButton
                        variant="secondary"
                        onClick={() => {
                          setStep(1);
                          setConfirmText('');
                        }}
                        className="flex-1"
                      >
                        Go Back
                      </NeonButton>
                      <NeonButton
                        variant="danger"
                        onClick={handleDelete}
                        loading={deleting}
                        disabled={confirmText.toLowerCase() !== 'delete my account'}
                        className="flex-1"
                      >
                        Delete Forever
                      </NeonButton>
                    </div>
                  </div>
                </NeonCard>
              </>
            )}

          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}