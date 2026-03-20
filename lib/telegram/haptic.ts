/** Telegram WebApp haptic; no-op if unavailable. */
export function hapticImpactLight(): void {
  try {
    const w = window as Window & {
      Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } };
    };
    w.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
  } catch {
    /* ignore */
  }
}

export function hapticNotificationWarning(): void {
  try {
    const w = window as Window & {
      Telegram?: {
        WebApp?: {
          HapticFeedback?: { notificationOccurred?: (s: string) => void };
        };
      };
    };
    w.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
  } catch {
    /* ignore */
  }
}
