import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { migrateUserTransactions } from '@/components/utils/migrateUserTransactions';
import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import { ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function MigrateData() {
  const navigate = useNavigate();
  const [migrationState, setMigrationState] = useState('idle'); // idle, running, complete, error
  const [progress, setProgress] = useState({ migrated: 0, skipped: 0, total: 0 });

  const handleMigrate = async () => {
    setMigrationState('running');
    
    const result = await migrateUserTransactions((prog) => {
      setProgress(prog);
    });

    if (result.success) {
      setMigrationState('complete');
      toast.success(`Migration complete! ${result.migrated} transactions updated.`);
    } else {
      setMigrationState('error');
      toast.error('Migration failed: ' + result.error);
    }
  };

  return (
    <SpaceBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NeonCard className="p-8" glowColor="cyan">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Category Migration</h1>
                <p className="text-slate-400 text-sm">
                  Update your existing transactions to the new category structure
                </p>
              </div>

              {migrationState === 'idle' && (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                    <p className="text-white font-semibold">What will change:</p>
                    <ul className="text-slate-400 space-y-1 list-disc list-inside">
                      <li>Home-related categories will be grouped under "Home Expenses"</li>
                      <li>Rent, Electricity, Water, Gas, etc. become sub-categories</li>
                      <li>All your data will be preserved</li>
                      <li>This is a one-time update</li>
                    </ul>
                  </div>
                  
                  <NeonButton
                    onClick={handleMigrate}
                    className="w-full"
                  >
                    Start Migration
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </NeonButton>
                </>
              )}

              {migrationState === 'running' && (
                <>
                  <div className="mb-6">
                    <p className="text-white text-center mb-4">
                      Migrating transactions... {progress.migrated + progress.skipped} / {progress.total}
                    </p>
                    <NeonProgress
                      value={progress.migrated + progress.skipped}
                      max={progress.total}
                      color="cyan"
                      showLabel
                    />
                  </div>
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
                  </div>
                </>
              )}

              {migrationState === 'complete' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-white font-semibold mb-2">Migration Complete!</p>
                    <div className="bg-slate-800/50 rounded-xl p-4 space-y-1 text-sm text-slate-400">
                      <p>Total: {progress.total} transactions</p>
                      <p>Updated: {progress.migrated}</p>
                      <p>Already current: {progress.skipped}</p>
                    </div>
                  </div>
                  <NeonButton
                    onClick={() => navigate(createPageUrl('Dashboard'))}
                    className="w-full"
                    variant="primary"
                  >
                    Go to Dashboard
                  </NeonButton>
                </>
              )}

              {migrationState === 'error' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-white font-semibold mb-2">Migration Failed</p>
                    <p className="text-slate-400 text-sm">Please try again or contact support</p>
                  </div>
                  <NeonButton
                    onClick={() => setMigrationState('idle')}
                    className="w-full"
                    variant="secondary"
                  >
                    Try Again
                  </NeonButton>
                </>
              )}
            </NeonCard>
          </motion.div>
        </div>
      </div>
    </SpaceBackground>
  );
}