import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NeonButton from '@/components/ui/NeonButton';
import { Crown, ExternalLink } from 'lucide-react';
import { BillingProvider } from '@/components/billing/BillingProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ManageSubscriptionModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleManageInAppStore = () => {
    BillingProvider.manageSubscription();
  };

  const handleChangePlan = () => {
    onClose();
    navigate(createPageUrl('Pricing'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-[95vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-purple-400" />
            Manage Subscription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4 pb-safe">
          <NeonButton
            onClick={handleManageInAppStore}
            variant="primary"
            className="w-full justify-between min-h-[48px]"
          >
            <span>Cancel or Modify Subscription</span>
            <ExternalLink className="w-4 h-4" />
          </NeonButton>

          <p className="text-xs text-slate-400 text-center px-4">
            Opens your App Store subscription settings where you can cancel or change your plan
          </p>

          <div className="border-t border-slate-700 my-4" />

          <NeonButton
            onClick={handleChangePlan}
            variant="secondary"
            className="w-full min-h-[48px]"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade or Downgrade Plan
          </NeonButton>

          <div className="border-t border-slate-700 my-4" />

          <p className="text-xs text-slate-400 text-center">
            Need help? Visit Settings → Support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}