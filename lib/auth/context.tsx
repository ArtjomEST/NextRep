'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { callTelegramReady, getTelegramInitData } from './client';
import { fetchMe, linkAccount, type MeResponse } from '@/lib/api/client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: MeResponse | null;
  isLinked: boolean;
  isTelegram: boolean;
  refetch: () => Promise<void>;
  link: () => Promise<boolean>;
  errorMessage: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  user: null,
  isLinked: false,
  isTelegram: false,
  refetch: async () => {},
  link: async () => false,
  errorMessage: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

const MAX_SDK_POLLS = 10;
const SDK_POLL_MS = 100;

function waitForTelegramSdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    let polls = 0;
    const check = () => {
      if (window.Telegram?.WebApp) {
        resolve(true);
        return;
      }
      polls++;
      if (polls >= MAX_SDK_POLLS) {
        resolve(false);
        return;
      }
      setTimeout(check, SDK_POLL_MS);
    };
    check();
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialized = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      setErrorMessage(null);
      const me = await fetchMe();
      if (me) {
        setUser(me);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      setUser(null);
      setStatus('unauthenticated');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to verify authentication');
    }
  }, []);

  const handleLink = useCallback(async () => {
    const ok = await linkAccount();
    if (ok) {
      await fetchUser();
    }
    return ok;
  }, [fetchUser]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const sdkAvailable = await waitForTelegramSdk();

      if (sdkAvailable) {
        callTelegramReady();
      }

      const hasInitData = !!getTelegramInitData();
      setIsTelegram(hasInitData);

      await fetchUser();
    })();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isLinked: user?.isLinked ?? false,
        isTelegram,
        refetch: fetchUser,
        link: handleLink,
        errorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
