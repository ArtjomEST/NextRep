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
import { fetchProfileApi, saveProfileApi, updateProfileApi, type UserProfile, type OnboardingData } from '@/lib/api/client';

interface ProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  refetch: () => Promise<void>;
  saveProfile: (data: OnboardingData) => Promise<void>;
  updateProfile: (data: Partial<OnboardingData>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  refetch: async () => {},
  saveProfile: async () => {},
  updateProfile: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const data = await fetchProfileApi();
        setProfile(data);
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
      setIsLoading(false);
      fetchedRef.current = false;
    }
  }, [status, fetchProfile]);

  const saveProfile = useCallback(async (data: OnboardingData) => {
    const saved = await saveProfileApi(data);
    setProfile(saved);
    fetchedRef.current = true;
  }, []);

  const updateProfile = useCallback(async (data: Partial<OnboardingData>) => {
    const updated = await updateProfileApi(data);
    setProfile(updated);
    fetchedRef.current = true;
  }, []);

  const hasCompletedOnboarding = profile?.onboardingCompleted === true;

  return (
    <ProfileContext.Provider
      value={{ profile, isLoading, hasCompletedOnboarding, refetch: fetchProfile, saveProfile, updateProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
