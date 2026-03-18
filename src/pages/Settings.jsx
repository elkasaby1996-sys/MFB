import React, { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import AlienAvatar, { AVATARS } from '@/components/ui/AlienAvatar';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingService } from '@/components/services/OnboardingService';
import { BackupService } from '@/components/services/BackupService';
import { NotificationService } from '@/components/services/NotificationService';
import { AppearanceService } from '@/components/services/AppearanceService';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import ManageSubscriptionModal from '@/components/subscription/ManageSubscriptionModal';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { Badge } from '@/components/ui/badge';
import MobileSelect from '@/components/ui/MobileSelect';
import { CURRENCIES } from '@/components/constants/currencies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User, 
  Crown, 
  LogOut, 
  ChevronRight, 
  Bot, 
  Palette,
  Shield,
  Bell,
  HelpCircle,
  Star,
  Zap,
  Check,
  Globe,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Sparkles,
  X,
  DollarSign
} from "lucide-react";
import CurrencyExpatSettings from '@/components/settings/CurrencyExpatSettings';
import SalarySettings from '@/components/salary/SalarySettings';
import { motion } from 'framer-motion';

const PLANS = [
  {
    id: 'free',
    name: 'Finance Bro Free',
    price: '$0',
    period: 'forever',
    color: 'slate',
    features: [
      'Basic budgeting',
      'Expense tracking',
      'Savings goals',
      '5 AI messages/month',
    ],
  },
  {
    id: 'pro',
    name: 'Finance Bro Pro',
    price: '$9.99',
    period: '/month',
    productId: 'com.myfinancebro.pro.monthly',
    color: 'purple',
    popular: true,
    features: [
      'Everything in Free + Unlimited',
      'Receipt Scanner',
      'Finance Vault',
      'Advanced analytics',
      'Multi-currency tracking',
      'Debit & Credit card tracking (up to 5)',
      'Receipt scanning',
      'Export reports',
      'Budget insights',
      'Expat mode',
      'Subscription tracking',
      '30 AI messages/month',
    ],
  },
  {
    id: 'elite',
    name: 'Finance Bro Elite',
    price: '$14.99',
    period: '/month',
    productId: 'com.myfinancebro.elite.monthly',
    color: 'cyan',
    features: [
      'Everything in Pro + Unlimited',
      'Unlimited Debit & Credit cards',
      'Investment tracking',
      'Net worth tracker',
      'Global expat tools',
      '50 AI messages/month',
    ],
  },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPlans, setShowPlans] = useState(urlParams.get('showPlans') === 'true');
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetOnboardingConfirm, setShowResetOnboardingConfirm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [showSalarySettings, setShowSalarySettings] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    dailyReminder: false,
    weeklyReminder: false,
    dailyReminderTime: '20:00',
    weeklyReminderDay: 0,
  });
  const [appearancePrefs, setAppearancePrefs] = useState({
    theme: 'system',
    currencyDisplay: 'symbol',
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setShowEditProfile(false);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ id, plan }) => base44.entities.UserProfile.update(id, { plan_tier: plan }),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setShowPlans(false);
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD',
    avatar: 'green-suit',
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        currency: profile.currency || 'USD',
        avatar: profile.avatar || 'green-suit',
      });
    }
  }, [profile]);

  // Load notification preferences
  React.useEffect(() => {
    const loadNotificationPrefs = async () => {
      const prefs = await NotificationService.getPreferences();
      setNotificationPrefs(prefs);
    };
    loadNotificationPrefs();
  }, []);

  // Load appearance preferences
  React.useEffect(() => {
    const loadAppearancePrefs = async () => {
      const prefs = await AppearanceService.getPreferences();
      setAppearancePrefs(prefs);
      AppearanceService.applyTheme(prefs.theme);
    };
    loadAppearancePrefs();
  }, []);

  const handleSaveProfile = () => {
    if (profile) {
      updateMutation.mutate({ id: profile.id, data: formData });
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      toast.info('Preparing backup...');
      const backupData = await BackupService.exportData();
      BackupService.downloadBackup(backupData);
      toast.success('Backup downloaded successfully!');
    } catch (error) {
      toast.error('Failed to export data: ' + error.message);
    }
    setExporting(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const backupData = await BackupService.readBackupFile(file);
      const validation = BackupService.validateBackup(backupData);
      
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setImportFile(backupData);
      setImportSummary(validation);
    } catch (error) {
      toast.error('Failed to read backup file');
    }
  };

  const handleImportData = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      await BackupService.importData(importFile);
      toast.success('Data imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      setImportSummary(null);
      queryClient.invalidateQueries();
      // Reload the page to refresh all data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to import data: ' + error.message);
    }
    setImporting(false);
  };

  const handleResetOnboarding = async () => {
    try {
      toast.info('Resetting onboarding...');
      
      // Delete user profile to force onboarding
      if (profile?.id) {
        await base44.entities.UserProfile.delete(profile.id);
      }
      
      // Reset onboarding service
      await OnboardingService.reset();
      
      // Invalidate queries and navigate
      queryClient.invalidateQueries(['userProfile']);
      
      toast.success('Onboarding reset! Redirecting...');
      setTimeout(() => {
        navigate(createPageUrl('Onboarding'));
      }, 500);
    } catch (error) {
      toast.error('Failed to reset onboarding');
    }
  };

  const handleResetAllData = async () => {
    try {
      toast.info('Deleting all data...');
      
      // Delete all entity data
      const entityTypes = [
        'Transaction', 'Budget', 'SavingsGoal', 'Investment', 'BrokerageAccount',
        'Debt', 'Subscription', 'UserMission', 'Watchlist', 'NetWorthHistory',
        'SideHustleClient', 'SideHustleProject', 'SideHustleInvoice', 
        'SideHustleTransaction', 'FXRate', 'Donation', 'GivingGoal', 
        'ZakatProfile', 'ManualAsset', 'Remittance', 'RemittanceGoal', 
        'CountryProfile', 'Receipt', 'UserProfile'
      ];

      for (const entityType of entityTypes) {
        try {
          const records = await base44.entities[entityType].list('', 10000);
          if (records && records.length > 0) {
            for (const record of records) {
              await base44.entities[entityType].delete(record.id);
            }
          }
        } catch (error) {
          console.warn(`Could not delete ${entityType}:`, error);
        }
      }

      // Reset onboarding
      await OnboardingService.reset();
      
      toast.success('All data deleted! Redirecting to onboarding...');
      setShowResetConfirm(false);
      
      setTimeout(() => {
        navigate(createPageUrl('Onboarding'));
      }, 1500);
    } catch (error) {
      toast.error('Failed to reset data');
    }
  };

  const handleNotificationToggle = async (type, value) => {
    if (value) {
      const hasPermission = await NotificationService.requestPermission();
      if (!hasPermission) {
        toast.error('Please enable notifications in your browser settings');
        return;
      }
    }

    const newPrefs = { ...notificationPrefs, [type]: value };
    setNotificationPrefs(newPrefs);
    await NotificationService.savePreferences(newPrefs);
    
    if (value) {
      toast.success('Notification reminder enabled!');
    }
  };

  const handleThemeChange = async (theme) => {
    const newPrefs = { ...appearancePrefs, theme };
    setAppearancePrefs(newPrefs);
    await AppearanceService.savePreferences(newPrefs);
    AppearanceService.applyTheme(theme);
    toast.success('Theme updated!');
  };

  const handleCurrencyDisplayChange = async (display) => {
    const newPrefs = { ...appearancePrefs, currencyDisplay: display };
    setAppearancePrefs(newPrefs);
    await AppearanceService.savePreferences(newPrefs);
    toast.success('Currency display updated!');
  };

  const handleRateApp = () => {
    toast.info('Thank you for your support! 🌟');
    // In production, this would trigger native review prompt
    // For web, we can show a message or link to feedback
  };

  const currentPlan = PLANS.find(p => p.id === (profile?.plan_tier || 'free'));
  const messagesUsed = profile?.ai_messages_used || 0;
  const messageLimit = profile?.plan_tier === 'pro' ? 30 : profile?.plan_tier === 'elite' ? 50 : 5;

  return (
    <SpaceBackground>
      <SubPageHeader title="Settings" />
      <main className="pb-24 px-4 sm:px-6">
        <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4">
          
          {/* Profile Card */}
          <NeonCard className="p-4 sm:p-5" glowColor="cyan">
            <div className="flex items-center gap-3 sm:gap-4">
              <AlienAvatar avatarId={profile?.avatar} size="lg" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-lg sm:text-xl font-bold truncate">{profile?.name || 'Finance Bro'}</h2>
                <p className="text-slate-400 text-sm">{profile?.currency || 'USD'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (profile?.plan_tier === 'pro' || profile?.plan_tier === 'elite') ? 'bg-purple-500/20 text-purple-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {currentPlan?.name || 'Finance Bro Starter'}
                  </div>
                </div>
              </div>
              <NeonButton 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEditProfile(true)}
                className="min-h-[44px] min-w-[44px] flex-shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </NeonButton>
            </div>
          </NeonCard>

          {/* AI Usage */}
          <NeonCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-purple-500/20 flex-shrink-0">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm sm:text-base">AI Messages</p>
                  <p className="text-slate-400 text-xs sm:text-sm">This month</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-bold text-sm sm:text-base whitespace-nowrap">{messagesUsed} / {messageLimit}</p>
                <p className="text-slate-400 text-xs">used</p>
              </div>
            </div>
          </NeonCard>

          {/* Subscription */}
          <NeonCard className="p-4" glowColor="purple">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500/20 flex-shrink-0">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm sm:text-base">Subscription Plan</p>
                    <p className="text-slate-400 text-xs sm:text-sm truncate">{currentPlan?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {profile?.plan_tier === 'free' && (
                    <Badge className="bg-purple-500/20 text-purple-400 whitespace-nowrap">
                      Upgrade
                    </Badge>
                  )}
                  {(profile?.plan_tier === 'pro' || profile?.plan_tier === 'elite') && (
                    <Badge className="bg-green-500/20 text-green-400 whitespace-nowrap">
                      {profile?.plan_tier === 'elite' ? 'ELITE' : 'PRO'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <NeonButton
                  onClick={() => navigate(createPageUrl('Pricing'))}
                  variant={profile?.plan_tier === 'free' ? 'purple' : 'secondary'}
                  className="flex-1"
                >
                  {profile?.plan_tier === 'free' ? 'Upgrade to PRO' : 'View Plans'}
                </NeonButton>
                {(profile?.plan_tier === 'pro' || profile?.plan_tier === 'elite') && (
                  <NeonButton
                    onClick={() => setShowManageSubscription(true)}
                    variant="secondary"
                    size="md"
                    className="min-w-[100px]"
                  >
                    Manage
                  </NeonButton>
                )}
              </div>
            </div>
          </NeonCard>

          {/* Data Management */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-slate-400 text-sm font-semibold px-1">Data Management</h3>
            
            <NeonCard 
              className="p-4 cursor-pointer min-h-[60px]"
              onClick={handleExportData}
              hover={true}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Download className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm sm:text-base">Export Data</p>
                    <p className="text-slate-400 text-xs">Backup all your data</p>
                  </div>
                </div>
                {exporting && <div className="animate-spin w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full" />}
              </div>
            </NeonCard>

            <NeonCard 
              className="p-4 cursor-pointer min-h-[60px]"
              onClick={() => setShowImportModal(true)}
              hover={true}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Upload className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm sm:text-base">Import Data</p>
                    <p className="text-slate-400 text-xs">Restore from backup</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </NeonCard>

            <NeonCard 
              className="p-4 cursor-pointer min-h-[60px] border-red-500/30"
              onClick={() => setShowResetConfirm(true)}
              hover={true}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-400 text-sm sm:text-base">Reset All Data</p>
                    <p className="text-slate-400 text-xs">Delete everything</p>
                  </div>
                </div>
              </div>
            </NeonCard>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-slate-400 text-sm font-semibold px-1">General</h3>
            {[
              { icon: Globe, label: 'Currency & Expat Settings', action: () => setShowCurrencySettings(true) },
              { icon: DollarSign, label: 'Salary & Auto-Logging', action: () => setShowSalarySettings(true) },
              { icon: Bell, label: 'Notifications', action: () => setShowNotifications(true) },
              { icon: Shield, label: 'Privacy & Security', action: () => setShowPrivacySecurity(true) },
              { icon: HelpCircle, label: 'Help & Support', action: () => navigate(createPageUrl('Support')) },
              { icon: Star, label: 'Rate the App', action: handleRateApp },
              { icon: Sparkles, label: 'About', action: () => navigate(createPageUrl('About')) },
              { icon: Trash2, label: 'Delete Account', action: () => navigate(createPageUrl('DeleteAccount')), danger: true },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NeonCard 
                  className={`p-4 cursor-pointer min-h-[60px] ${item.danger ? 'border-red-500/30' : ''}`}
                  onClick={item.action}
                  hover={true}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${item.danger ? 'text-red-400' : 'text-slate-400'}`} />
                      <p className={`text-sm sm:text-base truncate ${item.danger ? 'text-red-400' : 'text-white'}`}>{item.label}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>

          {/* Logout */}
          <NeonButton 
            variant="danger" 
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </NeonButton>

          <p className="text-center text-slate-500 text-xs">
            MyFinanceBro v1.0.0
          </p>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
            <button
              onClick={() => setShowEditProfile(false)}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
            <div className="flex justify-center">
              <AlienAvatar avatarId={formData.avatar} size="xl" />
            </div>

            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Avatar</Label>
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-2 w-full">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.id }))}
                    className="flex justify-center"
                  >
                    <AlienAvatar
                      avatarId={avatar.id}
                      size="md"
                      selected={formData.avatar === avatar.id}
                      showGlow={formData.avatar === avatar.id}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12 w-full"
              />
            </div>

            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Currency</Label>
              <MobileSelect
                value={formData.currency}
                onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                options={CURRENCIES.map(c => ({ value: c.code, label: c.code, icon: c.flag, description: c.name }))}
                placeholder="Select currency"
                title="Select Currency"
                searchable
                triggerClassName="mt-1"
              />
            </div>

          
          {/* Extra spacing */}
          <div className="h-4" />
          </div>
          
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 sm:px-6 py-4 pb-safe">
            <div className="flex gap-3">
              <NeonButton
                type="button"
                variant="secondary"
                onClick={() => setShowEditProfile(false)}
                className="hidden sm:flex flex-1 min-h-[52px]"
              >
                Cancel
              </NeonButton>
              <NeonButton 
                onClick={handleSaveProfile}
                loading={updateMutation.isPending}
                className="w-full sm:flex-1 min-h-[52px] text-base font-semibold"
              >
                Save Changes
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plans Modal */}
      <Dialog open={showPlans} onOpenChange={setShowPlans}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-[95vw] sm:max-w-lg h-[95vh] sm:h-auto flex flex-col p-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-center text-lg">Choose Your Plan</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe space-y-4">
            {PLANS.map((plan) => {
              const isCurrentPlan = plan.id === (profile?.plan_tier || 'free');
              
              return (
                <NeonCard 
                  key={plan.id}
                  className={`p-4 sm:p-5 relative ${isCurrentPlan ? 'ring-2 ring-cyan-500' : ''}`}
                  glowColor={plan.color}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base sm:text-lg truncate">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl sm:text-2xl font-bold whitespace-nowrap ${
                          plan.color === 'purple' ? 'text-purple-400' :
                          plan.color === 'cyan' ? 'text-cyan-400' :
                          'text-slate-300'
                        }`}>{plan.price}</span>
                        <span className="text-slate-400 text-sm whitespace-nowrap">{plan.period}</span>
                      </div>
                    </div>
                    {isCurrentPlan && (
                      <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full whitespace-nowrap flex-shrink-0">
                        Current
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations?.map((limitation, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 text-slate-500 flex-shrink-0">✕</span>
                        <span className="text-slate-500">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {!isCurrentPlan && plan.id !== 'free' && (
                    <NeonButton 
                      className="w-full"
                      variant={plan.color === 'purple' ? 'purple' : 'primary'}
                      onClick={() => {
                        // Redirect to App Store for purchase
                        if (window.webkit?.messageHandlers?.iap) {
                          window.webkit.messageHandlers.iap.postMessage({
                            action: 'subscribe',
                            productId: plan.productId
                          });
                        } else if (window.Android?.purchaseSubscription) {
                          window.Android.purchaseSubscription(plan.productId);
                        } else {
                          toast.info('In-app purchases are only available in the mobile app');
                        }
                        setShowPlans(false);
                      }}
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade to {plan.name}
                    </NeonButton>
                  )}
                  {isCurrentPlan && plan.id !== 'free' && (
                    <NeonButton 
                      className="w-full"
                      variant="ghost"
                      onClick={() => {
                        // Manage subscription through App Store
                        if (window.webkit?.messageHandlers?.iap) {
                          window.webkit.messageHandlers.iap.postMessage({ action: 'manage' });
                        } else if (window.Android?.manageSubscription) {
                          window.Android.manageSubscription();
                        } else {
                          window.open('https://apps.apple.com/account/subscriptions', '_blank');
                        }
                      }}
                    >
                      Manage Subscription
                    </NeonButton>
                  )}
                </NeonCard>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Salary Settings Modal */}
      <Dialog open={showSalarySettings} onOpenChange={setShowSalarySettings}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-[95vw] sm:max-w-md h-auto max-h-[90vh] overflow-y-auto flex flex-col p-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-lg">Salary & Auto-Logging</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe">
            {profile && <SalarySettings profile={profile} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Currency & Expat Settings Modal */}
      <Dialog open={showCurrencySettings} onOpenChange={setShowCurrencySettings}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-[95vw] sm:max-w-2xl h-[95vh] sm:h-auto flex flex-col p-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-lg">Currency & Expat Settings</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe">
            <CurrencyExpatSettings 
              profile={profile}
              onUpdate={(data) => {
                updateMutation.mutate({ id: profile.id, data });
                setShowCurrencySettings(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Data Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Import Backup</DialogTitle>
            <button
              onClick={() => setShowImportModal(false)}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-safe space-y-4">
            {!importSummary ? (
              <div>
                <Label className="text-slate-300 mb-2 block">Select Backup File</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-slate-400 text-xs mt-2">
                  Select a previously exported backup file (.json)
                </p>
              </div>
            ) : (
              <div>
                <NeonCard className="p-4 bg-cyan-500/10 mb-4">
                  <h4 className="text-white font-semibold mb-2">Backup Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-300">
                      Exported: {new Date(importSummary.exportedAt).toLocaleDateString()}
                    </p>
                    <p className="text-slate-300">
                      Total Records: {importSummary.totalRecords}
                    </p>
                  </div>
                </NeonCard>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-semibold text-sm">Warning</p>
                      <p className="text-slate-300 text-xs mt-1">
                        This will delete all your current data and replace it with the backup data.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <NeonButton
                    variant="secondary"
                    onClick={() => {
                      setImportFile(null);
                      setImportSummary(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton
                    variant="primary"
                    onClick={handleImportData}
                    loading={importing}
                    className="flex-1"
                  >
                    Replace All Data
                  </NeonButton>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="text-red-400">Reset All Data?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold mb-2">This action is permanent!</p>
                  <p className="text-slate-300 text-sm">
                    All your data will be permanently deleted:
                  </p>
                  <ul className="text-slate-300 text-sm mt-2 space-y-1">
                    <li>• Transactions & budgets</li>
                    <li>• Savings goals & investments</li>
                    <li>• Debts & subscriptions</li>
                    <li>• All other financial data</li>
                  </ul>
                  <p className="text-yellow-400 text-sm mt-3 font-semibold">
                    💡 Tip: Export your data first if you want to keep a backup!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <NeonButton
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </NeonButton>
              <NeonButton
                variant="danger"
                onClick={handleResetAllData}
                className="flex-1"
              >
                Delete Everything
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Notifications</DialogTitle>
            <button
              onClick={() => setShowNotifications(false)}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe">
            <NotificationSettings profile={profile} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Appearance Modal */}
      <Dialog open={showAppearance} onOpenChange={setShowAppearance}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Appearance</DialogTitle>
            <button
              onClick={() => setShowAppearance(false)}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe space-y-5">
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">Theme</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                {[
                  { value: 'system', label: 'System Default', desc: 'Follow device settings' },
                  { value: 'light', label: 'Light', desc: 'Always use light theme' },
                  { value: 'dark', label: 'Dark', desc: 'Always use dark theme' },
                ].map((option, idx, arr) => (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all active:bg-slate-800 ${idx < arr.length - 1 ? 'border-b border-slate-800/70' : ''}`}
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{option.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{option.desc}</p>
                    </div>
                    {appearancePrefs.theme === option.value && <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">Currency Display</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                {[
                  { value: 'symbol', label: 'Symbol', example: '$100.00' },
                  { value: 'code', label: 'Code', example: 'USD 100.00' },
                ].map((option, idx, arr) => (
                  <button
                    key={option.value}
                    onClick={() => handleCurrencyDisplayChange(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all active:bg-slate-800 ${idx < arr.length - 1 ? 'border-b border-slate-800/70' : ''}`}
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{option.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Example: {option.example}</p>
                    </div>
                    {appearancePrefs.currencyDisplay === option.value && <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy & Security Modal */}
      <Dialog open={showPrivacySecurity} onOpenChange={setShowPrivacySecurity}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Privacy & Security</DialogTitle>
            <button
              onClick={() => setShowPrivacySecurity(false)}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe space-y-5">
            {/* Security badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-semibold">Your Data is Secure</p>
                <p className="text-slate-400 text-xs mt-0.5">Encrypted · Cloud synced · You control it</p>
              </div>
            </div>

            {/* Data Management */}
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">Data Management</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                {[
                  { icon: Download, color: 'text-green-400', label: 'Export Data', desc: 'Download backup file', action: handleExportData },
                  { icon: Upload, color: 'text-blue-400', label: 'Import Data', desc: 'Restore from backup', action: () => { setShowPrivacySecurity(false); setShowImportModal(true); } },
                  { icon: Trash2, color: 'text-red-400', label: 'Reset All Data', desc: 'Delete everything', action: () => { setShowPrivacySecurity(false); setShowResetConfirm(true); }, danger: true },
                  { icon: AlertTriangle, color: 'text-red-400', label: 'Delete Account', desc: 'Permanent removal', action: () => { setShowPrivacySecurity(false); navigate(createPageUrl('DeleteAccount')); }, danger: true },
                ].map((item, idx, arr) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-800 transition-all ${idx < arr.length - 1 ? 'border-b border-slate-800/70' : ''}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.danger ? 'text-red-400' : 'text-white'}`}>{item.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">Legal</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                {[
                  { label: 'Privacy Policy', action: () => { setShowPrivacySecurity(false); navigate(createPageUrl('PrivacyPolicy')); } },
                  { label: 'Terms of Service', action: () => { setShowPrivacySecurity(false); navigate(createPageUrl('TermsOfService')); } },
                ].map((item, idx, arr) => (
                  <button key={item.label} onClick={item.action} className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-slate-800 transition-all ${idx < arr.length - 1 ? 'border-b border-slate-800/70' : ''}`}>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">Analytics</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Allow Analytics</p>
                    <p className="text-slate-500 text-xs mt-0.5">Help us improve the app</p>
                  </div>
                  <Switch
                    checked={localStorage.getItem('analytics_enabled') === 'true'}
                    onCheckedChange={(val) => {
                      localStorage.setItem('analytics_enabled', val.toString());
                      toast.success(val ? 'Analytics enabled. Thank you!' : 'Analytics disabled');
                    }}
                    className="scale-75 origin-right"
                  />
                </div>
              </div>
              <p className="text-slate-600 text-xs mt-2 px-1">We never collect sensitive financial data.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Help & Support</DialogTitle>
            <button
              onClick={() => setShowHelp(false)}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe space-y-5">
            {/* How it works */}
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">How It Works</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                {[
                  { emoji: '💸', label: 'Track Income & Expenses', desc: 'Log all financial transactions' },
                  { emoji: '🏷️', label: 'Categories', desc: 'Organize spending for insights' },
                  { emoji: '📊', label: 'Budgeting', desc: 'Set monthly limits per category' },
                  { emoji: '🎯', label: 'Goals', desc: 'Create and track savings goals' },
                  { emoji: '🤖', label: 'AI Insights', desc: 'Personalized financial advice' },
                ].map((item, idx, arr) => (
                  <div key={item.label} className={`flex items-center gap-3 px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-slate-800/70' : ''}`}>
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">FAQ</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                {[
                  { q: 'Where is my data stored?', a: 'Securely in the cloud, linked to your account. Cached locally for offline access.' },
                  { q: 'What if I delete the app?', a: 'Cloud data stays intact. Reinstall and log in to restore it.' },
                  { q: 'Can I recover my data?', a: 'Yes — reinstall and log in. Or export a backup from Settings → Data Management.' },
                  { q: 'Does it work offline?', a: 'Yes! All features work offline except AI which requires internet.' },
                ].map((item, idx, arr) => (
                  <div key={item.q} className={`px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-slate-800/70' : ''}`}>
                    <p className="text-white text-sm font-medium">{item.q}</p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide mb-2 px-1">Contact</p>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
                <button
                  onClick={() => { window.location.href = 'mailto:support@myfinancebro.app?subject=MyFinanceBro Support&body=App Version: 1.0.0%0D%0A%0D%0ADescribe your issue:%0D%0A'; }}
                  className="w-full flex items-center justify-between px-4 py-3 active:bg-slate-800 transition-all"
                >
                  <p className="text-cyan-400 text-sm font-medium">Email Support</p>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentPage="Settings" />
      
      {/* Manage Subscription Modal */}
      <ManageSubscriptionModal 
        isOpen={showManageSubscription}
        onClose={() => setShowManageSubscription(false)}
      />
    </SpaceBackground>
  );
}