export interface ProStatus {
  isPro: boolean;
  proExpiresAt: Date | null;
  trialEndsAt: Date | null;
  trialUsed: boolean;
}

export function computeIsPro(profile: {
  proExpiresAt?: Date | null;
  trialEndsAt?: Date | null;
}): boolean {
  const now = new Date();
  return (
    (profile.proExpiresAt != null && profile.proExpiresAt > now) ||
    (profile.trialEndsAt != null && profile.trialEndsAt > now)
  );
}

export function triggerProGate() {
  window.dispatchEvent(new Event('progate'));
}
