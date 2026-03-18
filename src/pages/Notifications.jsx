import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import { CheckCheck, Bell, Clock, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: async () => {
      const response = await base44.functions.invoke('notifications_list', {
        limit: 50,
        unreadOnly: activeTab === 'unread',
      });
      return response.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      return await base44.functions.invoke('notifications_markRead', {
        notificationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notificationCount']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('notifications_markAllRead', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notificationCount']);
    },
  });

  const notifications = notificationsData?.notifications || [];

  const handleNotificationClick = async (notification) => {
    if (!notification.readAt) {
      await markReadMutation.mutateAsync(notification.id);
    }

    if (notification.actionRoute) {
      navigate(createPageUrl(notification.actionRoute.replace('/', '')));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning': return 'text-orange-400 bg-orange-500/10';
      case 'success': return 'text-green-400 bg-green-500/10';
      default: return 'text-cyan-400 bg-cyan-500/10';
    }
  };

  const getSeverityIcon = (type) => {
    switch (type) {
      case 'bill_due': return '💡';
      case 'budget_alert': return '💰';
      case 'debt_due': return '💳';
      case 'goal_progress': return '🎯';
      case 'system': return '🔔';
      default: return '📬';
    }
  };

  return (
    <SpaceBackground>
      <main className="pb-24 px-4 sm:px-6 pt-safe">
        <div className="max-w-lg mx-auto space-y-4 py-4">
          
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-cyan-400" />
              Notifications
            </h1>
            {notifications.some(n => !n.readAt) && (
              <NeonButton
                size="sm"
                variant="ghost"
                onClick={() => markAllReadMutation.mutate()}
                loading={markAllReadMutation.isPending}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </NeonButton>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'unread'
                  ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <DashboardSkeleton />
          ) : notifications.length === 0 ? (
            <NeonCard className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-white font-semibold mb-1">
                {activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
              </p>
              <p className="text-slate-400 text-sm">
                {activeTab === 'unread' 
                  ? 'No unread notifications at the moment' 
                  : "We'll notify you about bills, budgets, and more"}
              </p>
            </NeonCard>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NeonCard
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all active:scale-[0.98] ${
                      notification.readAt
                        ? 'bg-slate-900/50 border-slate-800'
                        : 'bg-slate-900 border-cyan-500/20'
                    }`}
                    hover={true}
                  >
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(notification.severity)}`}>
                          <span className="text-xl">{getSeverityIcon(notification.type)}</span>
                        </div>
                        {!notification.readAt && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-slate-950" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold mb-1 ${notification.readAt ? 'text-slate-400' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-slate-400 text-xs line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span className="text-slate-600 text-xs">
                            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </NeonCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav currentPage="More" />
    </SpaceBackground>
  );
}