import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Divider, List, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';

import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotifications,
  useNotificationsRealtime,
} from '@/features/notifications/notifications-queries';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

function formatTimestamp(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function iconForType(type: string) {
  if (type === 'event_created') return 'calendar-plus';
  if (type === 'schedule_changed') return 'calendar-clock';
  if (type === 'arrival_update') return 'map-marker-check';
  if (type === 'eta_update') return 'timer-outline';
  return 'bell-outline';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useSupabaseSession();
  const notificationsQuery = useNotifications(user?.id);
  useNotificationsRealtime(user?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  );

  return (
    <View style={styles.screen}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notifications" subtitle="Arrivals & schedules" />
        <Appbar.Action
          icon="check-all"
          disabled={!user || unreadCount === 0 || markAllRead.isPending}
          onPress={() => user && markAllRead.mutate({ recipientId: user.id })}
        />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        {authLoading ? (
          <Text variant="bodyMedium">Loading notifications...</Text>
        ) : !user ? (
          <Text variant="bodyMedium">Sign in to view notifications.</Text>
        ) : notificationsQuery.isLoading ? (
          <Text variant="bodyMedium">Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <Text variant="bodyMedium">No notifications yet.</Text>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationRow}>
              <List.Item
                title={notification.title}
                description={
                  notification.body
                    ? `${notification.body} · ${formatTimestamp(notification.created_at)}`
                    : formatTimestamp(notification.created_at)
                }
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={iconForType(notification.type)}
                    color={
                      notification.read_at ? theme.colors.onSurfaceVariant : theme.colors.primary
                    }
                  />
                )}
                onPress={() => {
                  if (!notification.read_at) {
                    markRead.mutate({ id: notification.id });
                  }
                  if (notification.event_id) {
                    router.push(`/event/${notification.event_id}`);
                  }
                }}
              />
              <Divider />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  notificationRow: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
