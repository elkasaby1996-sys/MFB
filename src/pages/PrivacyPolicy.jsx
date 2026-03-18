import React from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonCard from '@/components/ui/NeonCard';
import { ChevronLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <SpaceBackground>
      <div className="min-h-screen" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-3 sticky top-0 bg-slate-950/80 backdrop-blur-lg z-10">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
        </div>

        {/* Content */}
        <div className="px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            
            <NeonCard className="p-6 mb-6" glowColor="green">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Your Privacy is Our Priority</h3>
                  <p className="text-slate-400 text-sm">
                    MyFinanceBro stores your data securely in the cloud to sync across devices. Some data may be cached on your device for offline access.
                  </p>
                </div>
              </div>
            </NeonCard>

            <div className="space-y-6 text-slate-300">
              
              <section>
                <p className="text-slate-500 text-sm mb-4">Last Updated: January 27, 2026</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">1. Overview</h2>
                <p className="text-sm leading-relaxed">
                  MyFinanceBro helps you manage your finances across devices. Your data is stored securely in our cloud infrastructure (Base44) so you can access it from any device. This policy explains what data we collect, how we use it, and your rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">2. Data We Collect</h2>
                <p className="text-sm leading-relaxed mb-2">
                  We collect data you provide to deliver our services:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li><strong>Account Information:</strong> Email address, display name, and preferences (base currency, language, theme)</li>
                  <li><strong>Financial Data:</strong> Transactions, budgets, debts, savings goals, investments, remittances, and any other data you enter</li>
                  <li><strong>Receipt Images:</strong> If you use Smart Receipt Vault, we process uploaded receipt images to extract merchant names, amounts, and dates</li>
                  <li><strong>Diagnostics & Analytics:</strong> Crash logs and usage analytics only if you enable them in Settings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">3. AI Features</h2>
                <p className="text-sm leading-relaxed mb-2">
                  When you use AI-powered features (such as receipt analysis or financial insights), we send only the information necessary to process your request.
                </p>
                <p className="text-sm leading-relaxed mb-2">
                  This data is used solely to provide the requested feature and is handled securely. We do not use your data to sell advertising, and we take steps to minimize data shared and protect it during processing.
                </p>
                <p className="text-sm leading-relaxed">
                  AI features require an internet connection. You can choose whether or not to use these features, and you remain in control of your data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">4. How We Use Data</h2>
                <p className="text-sm leading-relaxed mb-2">
                  We use your data to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Provide core features: track spending, create budgets, calculate net worth, and generate insights</li>
                  <li>Sync your data across devices</li>
                  <li>Process receipts using AI to extract information</li>
                  <li>Fetch live exchange rates and market prices when you use those features</li>
                  <li>Improve reliability and fix bugs (only if diagnostics are enabled)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">5. Where Data Is Stored</h2>
                <p className="text-sm leading-relaxed mb-2">
                  Your data is stored in two places:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li><strong>Cloud (Base44 backend):</strong> All your financial records are stored in a secure database associated with your account</li>
                  <li><strong>Local Device Cache:</strong> Some data may be cached on your device for offline access and faster loading</li>
                </ul>
                <p className="text-sm leading-relaxed mt-2 text-amber-400">
                  Important: Deleting the app from your device does not delete your cloud data. You must delete your account in Settings to permanently remove all data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">6. Third-Party Services</h2>
                <p className="text-sm leading-relaxed mb-2">
                  We use the following third-party services to operate the app:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                  <li><strong>Base44:</strong> Authentication, database, file storage, and server functions</li>
                  <li><strong>ExchangeRate API:</strong> Foreign exchange conversion rates</li>
                  <li><strong>Finnhub:</strong> Real-time market prices for stocks, ETFs, and crypto</li>
                  <li><strong>Apple App Store / StoreKit:</strong> Subscription management (subject to Apple's Privacy Policy)</li>
                  <li><strong>Receipt Processing:</strong> Receipt images are processed using Base44 AI functions to extract merchant names, dates, and amounts</li>
                </ul>
                <p className="text-sm leading-relaxed mt-3 text-slate-400">
                  <strong>Note:</strong> Live prices and FX rates require an internet connection. When offline, we show cached values where possible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">7. Data Sharing</h2>
                <p className="text-sm leading-relaxed mb-2">
                  We do not sell your personal data. We only share data with service providers necessary to operate the app:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Base44 (infrastructure provider)</li>
                  <li>ExchangeRate and Finnhub (only currency codes and symbols, no personal data)</li>
                  <li>Apple (only transaction IDs for subscription validation)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">8. Data Retention & Deletion</h2>
                <p className="text-sm leading-relaxed mb-2">
                  Your data is retained until you delete it:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li><strong>Individual Records:</strong> You can delete transactions, receipts, budgets, and other records at any time within the app</li>
                  <li><strong>All Data:</strong> Go to Settings → Data Management → Reset All Data</li>
                  <li><strong>Account Deletion:</strong> Go to Settings → Account → Delete Account (also accessible via Settings → Privacy & Security) to permanently remove your account and all associated cloud data</li>
                </ul>
                <p className="text-sm leading-relaxed mt-3 text-amber-400">
                  <strong>Important:</strong> Simply uninstalling the app does not delete your cloud data. You must explicitly delete your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">9. Security</h2>
                <p className="text-sm leading-relaxed mb-2">
                  We take security seriously:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li><strong>Encryption:</strong> All data transmitted between your device and our servers uses HTTPS</li>
                  <li><strong>Access Controls:</strong> Each user can only access their own data. Multi-tenant isolation ensures your data is never visible to other users</li>
                  <li><strong>Authentication:</strong> Secure login via Base44 authentication system</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">10. Children's Privacy</h2>
                <p className="text-sm leading-relaxed">
                  MyFinanceBro is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">11. Changes to This Policy</h2>
                <p className="text-sm leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the "Last Updated" date at the top of this policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">12. Contact Us</h2>
                <p className="text-sm leading-relaxed mb-2">
                  If you have questions about this Privacy Policy or your data, contact us at:
                </p>
                <a 
                  href="mailto:privacy@myfinancebro.app"
                  className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                >
                  privacy@myfinancebro.app
                </a>
              </section>

            </div>
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}