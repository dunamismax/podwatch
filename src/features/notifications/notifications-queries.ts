import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  pod_id: string | null;
  event_id: string | null;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
};

const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => [...notificationKeys.all, 'list', userId ?? 'none'] as const,
};

async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,recipient_id,actor_id,pod_id,event_id,type,title,body,created_at,read_at')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationRow[];
}

type MarkNotificationReadInput = {
  id: string;
};

async function markNotificationRead({ id }: MarkNotificationReadInput) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

type MarkAllNotificationsReadInput = {
  recipientId: string;
};

async function markAllNotificationsRead({ recipientId }: MarkAllNotificationsReadInput) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', recipientId)
    .is('read_at', null);

  if (error) {
    throw error;
  }
}

export function useNotifications(userId?: string | null) {
  return useQuery({
    queryKey: notificationKeys.list(userId ?? undefined),
    queryFn: () => fetchNotifications(userId ?? ''),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
}

export function useNotificationsRealtime(userId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
