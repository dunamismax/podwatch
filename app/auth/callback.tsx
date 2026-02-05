import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Text } from 'react-native-paper';

import { supabase } from '@/lib/supabase';

type SupportedOtpType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email';

function parseAuthParams(rawUrl: string) {
  const parsed = new URL(rawUrl);
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
  const hashParams = new URLSearchParams(hash);

  const getParam = (key: string) => parsed.searchParams.get(key) ?? hashParams.get(key);

  return {
    code: getParam('code'),
    tokenHash: getParam('token_hash'),
    type: getParam('type'),
    accessToken: getParam('access_token'),
    refreshToken: getParam('refresh_token'),
  };
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [message, setMessage] = useState('Finalizing your sign-in...');
  const processedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || processedUrlRef.current === url) return;
    processedUrlRef.current = url;

    let isMounted = true;

    const finalize = async () => {
      const { code, tokenHash, type, accessToken, refreshToken } = parseAuthParams(url);

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (isMounted) setMessage(error.message);
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as SupportedOtpType,
        });

        if (error) {
          if (isMounted) setMessage(error.message);
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (isMounted) setMessage(error.message);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (isMounted) {
          setMessage('Sign-in link was opened, but no session was created. Request a new link.');
        }
        return;
      }

      router.replace('/');
    };

    finalize();

    return () => {
      isMounted = false;
    };
  }, [router, url]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator />
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    textAlign: 'center',
  },
});
