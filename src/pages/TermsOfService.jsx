import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import { ChevronLeft } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <SpaceBackground>
      <div className="min-h-screen" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-3 sticky top-0 bg-slate-950/80 backdrop-blur-lg z-10">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Terms of Service</h1>
        </div>

        {/* Content */}
        <div className="px-4 pb-8">
          <div className="max-w-2xl mx-auto space-y-6 text-slate-300">
            
            <section>
              <p className="text-slate-500 text-sm mb-4">Last Updated: January 21, 2026</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">
                By downloading, installing, or using MyFinanceBro ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
              <p className="text-sm leading-relaxed">
                MyFinanceBro is a personal finance management application that helps you track expenses, manage budgets, set savings goals, and receive AI-powered financial insights. Your data is stored securely in the cloud (Base44 infrastructure) associated with your account, and cached locally for offline access. Syncing requires an internet connection.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. User Responsibilities</h2>
              <p className="text-sm leading-relaxed mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>Provide accurate information when using the App</li>
                <li>Keep your login credentials secure</li>
                <li>Not use the App for any illegal purposes</li>
                <li>Not attempt to reverse engineer or modify the App</li>
                <li>Not share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Subscription Terms</h2>
              <p className="text-sm leading-relaxed mb-2">
                <strong>Auto-Renewable Subscriptions (Pro & Elite):</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>Pro plan is billed at $9.99/month; Elite plan at $14.99/month</li>
                <li>Payment is charged to your App Store account at confirmation of purchase</li>
                <li>Subscriptions automatically renew each month unless canceled at least 24 hours before the end of the current period</li>
                <li>Your account will be charged for renewal within 24 hours prior to the end of the current period</li>
                <li>You can manage and cancel your subscription in your App Store / Google Play account settings at any time</li>
                <li>No refunds are provided for partial subscription periods under Apple / Google payment policies</li>
              </ul>
              <p className="text-xs text-slate-400 mt-3">
                To cancel: iOS → Settings → [Your Name] → Subscriptions → MyFinanceBro → Cancel. Android → Google Play → Subscriptions → MyFinanceBro → Cancel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Data and Privacy</h2>
              <p className="text-sm leading-relaxed">
                Your data is stored securely in our cloud infrastructure. We do not sell your personal data to third parties. For full details on what data we collect and how it is used, see our{' '}
                <button onClick={() => navigate(createPageUrl('PrivacyPolicy'))} className="text-cyan-400 underline">Privacy Policy</button>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. AI Features</h2>
              <p className="text-sm leading-relaxed">
                AI-powered insights are provided for informational purposes only and should not be considered professional financial advice. Always consult with a qualified financial advisor before making important financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Disclaimer of Warranties</h2>
              <p className="text-sm leading-relaxed">
                THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that the App will be error-free, secure, or always available. You use the App at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Limitation of Liability</h2>
              <p className="text-sm leading-relaxed">
                WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE APP.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Account Deletion</h2>
              <p className="text-sm leading-relaxed">
                You may delete your account at any time through Settings → Account → Delete Account (also accessible via Settings → Privacy & Security). This permanently removes your account and all associated cloud data from our servers. This action is irreversible. Note: simply uninstalling the app does not delete your cloud data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Changes to Terms</h2>
              <p className="text-sm leading-relaxed">
                We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Governing Law</h2>
              <p className="text-sm leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is registered.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Contact</h2>
              <p className="text-sm leading-relaxed mb-2">
                For questions about these Terms, contact us at:
              </p>
              <a 
                href="mailto:legal@myfinancebro.app"
                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
              >
                legal@myfinancebro.app
              </a>
            </section>

          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}