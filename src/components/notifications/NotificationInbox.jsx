import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import NeonButton from '@/components/ui/NeonButton';
import { X, CheckCheck, Bell, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function NotificationInbox({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('all'); // all | unread
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: async () => {
      const response = await base44.functions.invoke('notifications_list', {
        limit: 50,
        unreadOnly: activeTab === 'unread',
      });
      return response.data;
    },
    enabled: isOpen,
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
    // Mark as read if unread
    if (!notification.readAt) {
      await markReadMutation.mutateAsync(notification.id);
    }

    // Navigate if action route exists
    if (notification.actionRoute) {
      onClose();
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] bg-slate-950 border-slate-800 p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-6 pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-cyan-400" />
              Notifications
            </SheetTitle>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                activeTab === 'unread'
                  ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Mark all read */}
          {notifications.some(n => !n.readAt) && (
            <NeonButton
              size="sm"
              variant="ghost"
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
              className="mt-3 w-full"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </NeonButton>
          )}
        </SheetHeader>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
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
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 rounded-xl transition-all active:scale-[0.98] border ${
                      notification.readAt
                        ? 'bg-slate-900/50 border-slate-800'
                        : 'bg-slate-900 border-cyan-500/20 shadow-lg'
                    }`}
                    style={{ minHeight: 80 }}
                  >
                    <div className="flex gap-3">
                      {/* Icon + Unread dot */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(notification.severity)}`}>
                          <span className="text-xl">{getSeverityIcon(notification.type)}</span>
                        </div>
                        {!notification.readAt && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-slate-950" />
                        )}
                      </div>

                      {/* Content */}
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
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}