import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';

import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { queryClient } from '@/lib/queryClient';
import { paperDarkTheme } from '@/theme/paperTheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function PushNotificationsBootstrap() {
  const { user } = useSupabaseSession();
  useRegisterPushToken(user?.id);
  return null;
}

function NotificationRouter() {
  const router = useRouter();

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { eventId?: string };
      if (data?.eventId) {
        router.push(`/event/${data.eventId}`);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperDarkTheme}>
        <ThemeProvider value={DarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="create-pod" options={{ headerShown: false }} />
            <Stack.Screen name="create-event" options={{ headerShown: false }} />
            <Stack.Screen name="pod/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/edit/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="invites" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <PushNotificationsBootstrap />
          <NotificationRouter />
          <StatusBar style="light" />
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
