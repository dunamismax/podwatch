import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Text } from 'react-native-paper';

import { clearPendingMagicLinkEmail, getPendingMagicLinkEmail } from '@/lib/magic-link-state';
import { supabase } from '@/lib/supabase';

type SupportedOtpType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email';

type AuthParams = {
  code: string | null;
  tokenHash: string | null;
  token: string | null;
  type: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

type RouteAuthParams = Record<
  'code' | 'token_hash' | 'token' | 'type' | 'access_token' | 'refresh_token' | 'error' | 'error_code' | 'error_description',
  string | string[] | undefined
>;

function parseAuthParams(rawUrl: string): AuthParams {
  const decodeValue = (value: string) => decodeURIComponent(value.replace(/\+/g, ' '));
  const parseParamSegment = (segment: string) => {
    const params = new Map<string, string>();
    for (const pair of segment.split('&')) {
      if (!pair) continue;
      const separatorIndex = pair.indexOf('=');
      const rawKey = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair;
      const rawValue = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : '';
      const key = decodeValue(rawKey);
      if (!key) continue;
      params.set(key, decodeValue(rawValue));
    }
    return params;
  };

  const hashIndex = rawUrl.indexOf('#');
  const queryIndex = rawUrl.indexOf('?');
  const queryEnd = hashIndex >= 0 ? hashIndex : rawUrl.length;
  const query =
    queryIndex >= 0 && queryIndex < queryEnd ? rawUrl.slice(queryIndex + 1, queryEnd) : '';
  const hash = hashIndex >= 0 ? rawUrl.slice(hashIndex + 1) : '';
  const queryParams = parseParamSegment(query);
  const hashParams = parseParamSegment(hash);

  const getParam = (key: string) => queryParams.get(key) ?? hashParams.get(key);

  return {
    code: getParam('code'),
    tokenHash: getParam('token_hash'),
    token: getParam('token'),
    type: getParam('type'),
    accessToken: getParam('access_token'),
    refreshToken: getParam('refresh_token'),
    error: getParam('error'),
    errorCode: getParam('error_code'),
    errorDescription: getParam('error_description'),
  };
}

function parseRouteParams(params: RouteAuthParams): AuthParams {
  const pick = (value: string | string[] | undefined) =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

  return {
    code: pick(params.code),
    tokenHash: pick(params.token_hash),
    token: pick(params.token),
    type: pick(params.type),
    accessToken: pick(params.access_token),
    refreshToken: pick(params.refresh_token),
    error: pick(params.error),
    errorCode: pick(params.error_code),
    errorDescription: pick(params.error_description),
  };
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const routeParams = useLocalSearchParams<RouteAuthParams>();
  const [message, setMessage] = useState('Finalizing your sign-in...');
  const processedUrlRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const setScreenMessage = (value: string) => {
      if (isMounted) setMessage(value);
    };
    const redactSensitive = (value: string | null) =>
      value?.replace(
        /(token_hash|token|access_token|refresh_token|code)=([^&#]+)/g,
        '$1=[redacted]'
      ) ?? null;

    const finalizeFromParsed = async (parsed: AuthParams) => {
      const {
        code,
        tokenHash,
        token,
        type,
        accessToken,
        refreshToken,
        error,
        errorCode,
        errorDescription,
      } = parsed;

      if (error || errorCode || errorDescription) {
        setScreenMessage(errorDescription ?? errorCode ?? error ?? 'Unable to sign in.');
        return true;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setScreenMessage(error.message);
          return true;
        }
      } else if (type && (tokenHash || token)) {
        const otpType = type as SupportedOtpType;
        const tokenHashCandidate = tokenHash ?? token;
        let { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHashCandidate,
          type: otpType,
        });

        if (error && token) {
          const pendingEmail = getPendingMagicLinkEmail();
          if (pendingEmail) {
            const verifyByEmail = await supabase.auth.verifyOtp({
              email: pendingEmail,
              token,
              type: otpType,
            });
            error = verifyByEmail.error;
          }
        }

        if (error) {
          setScreenMessage(error.message);
          return true;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setScreenMessage(error.message);
          return true;
        }
      } else {
        return false;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setScreenMessage('Sign-in link was opened, but no session was created. Request a new link.');
        return true;
      }

      clearPendingMagicLinkEmail();
      router.replace('/');
      return true;
    };

    const finalizeFromUrl = async (rawUrl: string | null) => {
      if (!rawUrl || processedUrlRef.current.has(rawUrl)) return false;
      processedUrlRef.current.add(rawUrl);
      return finalizeFromParsed(parseAuthParams(rawUrl));
    };

    const finalize = async () => {
      try {
        const finalizedCurrent = await finalizeFromUrl(url);
        if (finalizedCurrent) return;

        const initialUrl = await Linking.getInitialURL();
        const finalizedInitial = await finalizeFromUrl(initialUrl);
        if (finalizedInitial) return;

        const finalizedRouteParams = await finalizeFromParsed(parseRouteParams(routeParams));
        if (finalizedRouteParams) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace('/');
          return;
        }

        const redactedCurrent = redactSensitive(url);
        const redactedInitial = redactSensitive(initialUrl);
        setScreenMessage(
          `No auth data found in the link. URL: ${redactedCurrent ?? 'none'} | Initial URL: ${redactedInitial ?? 'none'}`
        );
      } catch (error) {
        setScreenMessage(error instanceof Error ? error.message : 'Unable to finish sign-in.');
      }
    };

    void finalize();

    return () => {
      isMounted = false;
    };
  }, [routeParams, router, url]);

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
