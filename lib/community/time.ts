function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Relative time in English regardless of device locale.
 * Examples: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "5 days ago".
 */
export function formatTimeAgo(iso: string): string {
  const thenMs = new Date(iso).getTime();
  if (Number.isNaN(thenMs)) return '';

  const nowMs = Date.now();
  const diffSec = Math.floor((nowMs - thenMs) / 1000);
  if (diffSec < 0) return 'just now';

  if (diffSec < 45) return 'just now';

  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  }

  const postDay = startOfLocalDay(thenMs);
  const nowDay = startOfLocalDay(nowMs);
  const dayDiff = Math.round((nowDay - postDay) / 86400000);

  if (dayDiff === 1) return 'Yesterday';

  if (dayDiff > 1 && dayDiff < 7) {
    return `${dayDiff} days ago`;
  }

  const d = new Date(iso);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  };
  return d.toLocaleDateString('en-US', opts);
}

export function formatFeedDuration(durationSec: number | null): string {
  if (durationSec == null || durationSec <= 0) return '—';
  const m = Math.round(durationSec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}
