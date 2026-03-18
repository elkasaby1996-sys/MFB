import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { X, LayoutDashboard, Receipt, Wallet, Target, TrendingUp, BarChart3, FileText, Flame, RefreshCw, Home, Calendar, CreditCard, PieChart, Briefcase, Heart, Globe, Bot, Settings, ScanLine, Activity, User, FileSpreadsheet } from "lucide-react";
import AlienAvatar from '../ui/AlienAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const MENU_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Financial Health", icon: Activity, page: "HealthScore" },
  { name: "Spending Log", icon: Receipt, page: "SpendingLog" },
  { name: "Spending Calendar", icon: Calendar, page: "SpendingCalendar" },
  { name: "Budgets", icon: Wallet, page: "Budgets" },
  { name: "Receipts", icon: ScanLine, page: "Receipts" },
  { name: "Subscriptions", icon: RefreshCw, page: "Subscriptions" },
  { name: "Debt & Credit", icon: CreditCard, page: "DebtHub" },
  { name: "Side Hustle", icon: Briefcase, page: "SideHustle" },
  { name: "Charity & Giving", icon: Heart, page: "Charity" },
  { name: "Home Finance", icon: Home, page: "HomeFinance" },
  { name: "Savings", icon: Target, page: "Savings" },
  { name: "Investments", icon: TrendingUp, page: "Investments" },
  { name: "Reports", icon: FileSpreadsheet, page: "Reports" },
  { name: "Global / Expat Hub", icon: Globe, page: "ExpatHub" },
  { name: "AI Bro", icon: Bot, page: "AIAssistant" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function SideDrawer({ isOpen, onClose, profile, currentPage }) {
  const streakDays = profile?.streak_days || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-50 overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/50 text-slate-400 active:bg-slate-700 active:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Card */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.15)]">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <AlienAvatar 
                      avatarId={profile?.avatar || "green-suit"} 
                      size="lg"
                      showGlow={true}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-cyan-400 font-bold text-lg">
                      {profile?.name || "Finance Bro"}
                    </h3>
                    {/* Streak */}
                    <div className="flex items-center gap-2 mt-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-slate-300 text-sm">
                        <span className="text-orange-400 font-bold">{streakDays}</span> day streak
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="px-4 pb-6">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.page;

                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200",
                      isActive 
                        ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                        : "text-slate-400 active:text-white active:bg-slate-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}