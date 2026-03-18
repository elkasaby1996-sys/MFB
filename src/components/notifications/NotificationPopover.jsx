import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NeonButton from '@/components/ui/NeonButton';
import { CheckCheck, Bell, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationPopover({ children, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await base44.functions.invoke('notifications_list', {
        limit: 5,
        unreadOnly: false,
      });
      return response.data;
    },
    enabled: open,
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
  const hasUnread = notifications.some(n => !n.readAt);

  const handleNotificationClick = async (notification) => {
    if (!notification.readAt) {
      await markReadMutation.mutateAsync(notification.id);
    }

    onOpenChange(false);

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
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[360px] p-0 bg-slate-900 border-slate-700 shadow-2xl"
        align="center"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[60vh]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                Notifications
              </h3>
              {hasUnread && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">You're all caught up!</p>
                <p className="text-slate-400 text-xs">No notifications at the moment</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-800/50 border-b border-slate-800/50 last:border-b-0 ${
                      !notification.readAt ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSeverityColor(notification.severity)}`}>
                          <span className="text-base">{getSeverityIcon(notification.type)}</span>
                        </div>
                        {!notification.readAt && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-500 rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-semibold mb-0.5 ${notification.readAt ? 'text-slate-400' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-slate-400 text-xs line-clamp-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-2.5 h-2.5 text-slate-600" />
                          <span className="text-slate-600 text-[10px]">
                            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-900">
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate(createPageUrl('Notifications'));
                }}
                className="w-full text-center text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                View all notifications
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}