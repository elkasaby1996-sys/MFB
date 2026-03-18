import React from 'react';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NotificationBell() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const response = await base44.functions.invoke('notifications_unreadCount', {});
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
    retry: false,
  });

  const count = data?.count || 0;

  return (
    <button
      onClick={() => navigate(createPageUrl('Notifications'))}
      className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}