import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export function useRegisterPushToken(userId?: string | null) {
  const lastRegisteredUser = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || userId === lastRegisteredUser.current) return;
    lastRegisteredUser.current = userId;

    let isMounted = true;

    const registerToken = async () => {
      if (Platform.OS === 'web') return;

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        const projectId = getProjectId();
        if (!projectId) return;

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!isMounted) return;

        const token = tokenResponse.data;
        await supabase.from('user_push_tokens').upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        );

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
      } catch (error) {
        console.warn('Failed to register push token:', error);
      }
    };

    registerToken();

    return () => {
      isMounted = false;
    };
  }, [userId]);
}
