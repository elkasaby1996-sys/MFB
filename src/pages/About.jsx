import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonCard from '@/components/ui/NeonCard';
import { ChevronLeft, Info, Shield, FileText, Mail } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  const appInfo = {
    version: '1.0.0',
    build: '100',
    environment: process.env.NODE_ENV || 'production',
  };

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
          <h1 className="text-xl font-bold text-white">About</h1>
        </div>

        {/* Content */}
        <div className="px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* App Info */}
            <NeonCard className="p-6 text-center" glowColor="cyan">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <span className="text-4xl">💰</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">MyFinanceBro</h2>
              <p className="text-slate-400 mb-4">Your Personal Finance Assistant</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-slate-300">
                  Version {appInfo.version} ({appInfo.build})
                </span>
              </div>

              {appInfo.environment !== 'production' && (
                <div className="mt-3">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    {appInfo.environment.toUpperCase()}
                  </span>
                </div>
              )}
            </NeonCard>

            {/* Description */}
            <div className="text-slate-300 text-sm leading-relaxed text-center">
              <p>
                MyFinanceBro helps you take control of your finances with smart budgeting, 
                expense tracking, and AI-powered insights—all while keeping your data 
                private and secure on your device.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <NeonCard 
                className="p-4 cursor-pointer"
                onClick={() => navigate(createPageUrl('PrivacyPolicy'))}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Privacy Policy</p>
                    <p className="text-slate-400 text-xs">How we protect your data</p>
                  </div>
                </div>
              </NeonCard>

              <NeonCard 
                className="p-4 cursor-pointer"
                onClick={() => navigate(createPageUrl('TermsOfService'))}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Terms of Service</p>
                    <p className="text-slate-400 text-xs">App usage terms</p>
                  </div>
                </div>
              </NeonCard>

              <NeonCard 
                className="p-4 cursor-pointer"
                onClick={() => navigate(createPageUrl('Support'))}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Support</p>
                    <p className="text-slate-400 text-xs">Get help</p>
                  </div>
                </div>
              </NeonCard>
            </div>

            {/* Credits */}
            <div className="text-center text-xs text-slate-500 pt-4">
              <p>Made with ❤️ for better financial health</p>
              <p className="mt-2">© 2026 MyFinanceBro. All rights reserved.</p>
            </div>

          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}