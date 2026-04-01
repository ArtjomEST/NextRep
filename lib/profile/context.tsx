'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  fetchProfileApi,
  fetchMeProApi,
  saveProfileApi,
  updateProfileApi,
  type UserProfile,
  type OnboardingData,
  type ProfileUpdatePayload,
} from '@/lib/api/client';

interface ProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isPro: boolean;
  proExpiresAt: string | null;
  trialEndsAt: string | null;
  trialUsed: boolean;
  refetch: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: OnboardingData) => Promise<void>;
  updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
  showTrialOnboarding: boolean;
  trialOnboardingEndsAt: string | null;
  dismissTrialOnboarding: () => void;
  triggerTrialOnboarding: (trialEndsAt: string) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  isPro: false,
  proExpiresAt: null,
  trialEndsAt: null,
  trialUsed: false,
  refetch: async () => {},
  refreshProfile: async () => {},
  saveProfile: async () => {},
  updateProfile: async () => {},
  showTrialOnboarding: false,
  trialOnboardingEndsAt: null,
  dismissTrialOnboarding: () => {},
  triggerTrialOnboarding: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [showTrialOnboarding, setShowTrialOnboarding] = useState(false);
  const [trialOnboardingEndsAt, setTrialOnboardingEndsAt] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const [data, meData] = await Promise.all([
          fetchProfileApi(),
          fetchMeProApi().catch(() => ({
            isPro: false,
            proExpiresAt: null,
            trialEndsAt: null,
            trialUsed: false,
          })),
        ]);
        setProfile(data);
        setIsPro(meData.isPro);
        setProExpiresAt(meData.proExpiresAt);
        setTrialEndsAt(meData.trialEndsAt);
        setTrialUsed(meData.trialUsed);
        fetchedRef.current = true;
        lastError = undefined;
        break;
      } catch (err) {
        lastError = err;
        console.error('[ProfileContext] Failed to fetch profile:', err);
        if (attempt < maxAttempts - 1) {
          await new Promise((r) =>
            setTimeout(r, 350 * (attempt + 1)),
          );
        }
      }
    }
    if (lastError !== undefined) {
      setProfile(null);
      fetchedRef.current = false;
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && !fetchedRef.current) {
      void fetchProfile();
    } else if (status === 'unauthenticated') {
      setProfile(null);
      setIsPro(false);
      setProExpiresAt(null);
      setTrialEndsAt(null);
      setTrialUsed(false);
      setIsLoading(false);
      fetchedRef.current = false;
    }
  }, [status, fetchProfile]);

  const saveProfile = useCallback(async (data: OnboardingData) => {
    const saved = await saveProfileApi(data);
    setProfile(saved);
    fetchedRef.current = true;
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdatePayload) => {
    const updated = await updateProfileApi(data);
    setProfile(updated);
    fetchedRef.current = true;
  }, []);

  const hasCompletedOnboarding = profile?.onboardingCompleted === true;

  const triggerTrialOnboarding = useCallback((endsAt: string) => {
    setTrialOnboardingEndsAt(endsAt);
    setShowTrialOnboarding(true);
  }, []);

  const dismissTrialOnboarding = useCallback(() => {
    setShowTrialOnboarding(false);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        hasCompletedOnboarding,
        isPro,
        proExpiresAt,
        trialEndsAt,
        trialUsed,
        refetch: fetchProfile,
        refreshProfile: fetchProfile,
        saveProfile,
        updateProfile,
        showTrialOnboarding,
        trialOnboardingEndsAt,
        dismissTrialOnboarding,
        triggerTrialOnboarding,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
