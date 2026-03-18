import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { ChevronLeft, Mail, Copy, Check, HelpCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Support() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const diagnosticInfo = {
    version: '1.0.0',
    build: '100',
    platform: typeof window !== 'undefined' ? (window.webkit ? 'iOS' : window.Android ? 'Android' : 'Web') : 'Unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    timestamp: new Date().toISOString(),
  };

  const handleCopyDiagnostics = () => {
    const text = JSON.stringify(diagnosticInfo, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Diagnostics copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Message sent!', description: 'We\'ll get back to you within 24 hours.' });
      setFeedbackData({ name: '', email: '', message: '' });
    } catch (error) {
      toast({ title: 'Failed to send', description: 'Please try again or email us directly.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How do I track my expenses?',
      a: 'Tap the + button on the home screen or use the floating action button on any page to quickly add income or expenses.'
    },
    {
      q: 'How do I set up budgets?',
      a: 'Go to Dashboard → Budgets tab. Tap "Add Budget" and choose a category, set your limit, and track your spending against it.'
    },
    {
      q: 'Can I export my data?',
      a: 'Yes! Go to Settings → Data Management → Export Data to download a backup file containing all your financial information.'
    },
    {
      q: 'What happens if I cancel my subscription?',
      a: 'You\'ll retain PRO+ features until the end of your current billing period. After that, you\'ll be downgraded to the free plan.'
    },
    {
     q: 'Is my data safe?',
     a: 'Yes! Your data is stored securely in our cloud infrastructure, encrypted in transit and at rest. It is also cached locally on your device for offline access. Only you can access your financial data.'
    },
    {
      q: 'How do I restore my PRO+ subscription?',
      a: 'Go to Settings → Subscription Plan → Restore Purchases, or use the Restore Purchases button on the upgrade screen. This will verify any active subscriptions on your App Store account.'
    },
  ];

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
          <h1 className="text-xl font-bold text-white">Help & Support</h1>
        </div>

        {/* Content */}
        <div className="px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Feedback Form */}
            <NeonCard className="p-6" glowColor="cyan">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Send Feedback</h3>
                  <p className="text-slate-400 text-sm">
                    Let us know how we can improve. We read every message!
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={feedbackData.name}
                  onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={feedbackData.email}
                  onChange={(e) => setFeedbackData({...feedbackData, email: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
                <textarea
                  placeholder="Your message..."
                  value={feedbackData.message}
                  onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-24"
                  required
                />
                <NeonButton type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </NeonButton>
              </form>
            </NeonCard>

            {/* Diagnostics */}
            <NeonCard className="p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Copy className="w-5 h-5 text-slate-400" />
                Diagnostics
              </h3>
              <div className="bg-slate-950/50 rounded-lg p-4 mb-4 font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Version:</span>
                  <span className="text-slate-300">{diagnosticInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Build:</span>
                  <span className="text-slate-300">{diagnosticInfo.build}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform:</span>
                  <span className="text-slate-300">{diagnosticInfo.platform}</span>
                </div>
              </div>
              
              <NeonButton
                onClick={handleCopyDiagnostics}
                variant="secondary"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Diagnostics
                  </>
                )}
              </NeonButton>
              <p className="text-slate-500 text-xs mt-2 text-center">
                Include this when contacting support
              </p>
            </NeonCard>

            {/* FAQs */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-cyan-400" />
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <NeonCard key={idx} className="p-4">
                    <h4 className="text-white font-semibold mb-2 text-sm">{faq.q}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </NeonCard>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center text-sm text-slate-500 space-y-1">
              <p>MyFinanceBro Support</p>
              <a 
                href="mailto:support@myfinancebro.app"
                className="text-cyan-400 hover:text-cyan-300 underline block"
              >
                support@myfinancebro.app
              </a>
            </div>

          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}