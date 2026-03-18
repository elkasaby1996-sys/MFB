import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ComplianceLinks({ className = '' }) {
  const navigate = useNavigate();

  return (
    <div className={`flex flex-wrap justify-center gap-4 text-xs text-slate-500 ${className}`}>
      <button 
        onClick={() => navigate(createPageUrl('PrivacyPolicy'))}
        className="underline hover:text-slate-400 transition-colors"
      >
        Privacy Policy
      </button>
      <button 
        onClick={() => navigate(createPageUrl('TermsOfService'))}
        className="underline hover:text-slate-400 transition-colors"
      >
        Terms of Service
      </button>
      <button 
        onClick={() => navigate(createPageUrl('Support'))}
        className="underline hover:text-slate-400 transition-colors"
      >
        Support
      </button>
    </div>
  );
}