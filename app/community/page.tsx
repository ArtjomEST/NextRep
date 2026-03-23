'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/auth/context';
import {
  fetchFeedApi,
  toggleWorkoutLikeApi,
  togglePostLikeApi,
  savePresetCopyApi,
  deleteCommunityPostApi,
  patchWorkoutForFeedApi,
  uploadWorkoutPhotoApi,
  type FeedFilter,
  type FeedContentType,
} from '@/lib/api/client';
import type {
  FeedItem,
  FeedPostItem,
  FeedWorkoutItem,
  WorkoutCommentRow,
} from '@/lib/api/types';
import { formatTimeAgo, formatFeedDuration } from '@/lib/community/time';
import { compressImage } from '@/lib/utils/compressImage';
import {
  hapticImpactLight,
  hapticNotificationWarning,
} from '@/lib/telegram/haptic';
import CommunityCommentsSheet, {
  type CommentsTarget,
} from '@/components/CommunityCommentsSheet';
import CreatePostSheet from '@/components/CreatePostSheet';
import Card from '@/components/Card';
import MuscleMapLazy from '@/components/MuscleMapLazy';
import { WorkoutLogExerciseRow } from '@/components/WorkoutLogExerciseRow';

const FEED_CACHE_KEY = 'feed_cache';
const FEED_CACHE_TTL_MS = 5 * 60 * 1000;

type FeedCacheStore = {
  v: 3;
  entries: Record<
    string,
    {
      at: number;
      items: FeedItem[];
    }
  >;
};

function feedCacheEntryKey(filter: FeedFilter, type: FeedContentType): string {
  return `${filter}:${type}`;
}

function readValidCachedFeed(
  filter: FeedFilter,
  type: FeedContentType,
): FeedItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeedCacheStore;
    if (parsed.v !== 3 || !parsed.entries) return null;
    const ent = parsed.entries[feedCacheEntryKey(filter, type)];
    if (!ent || !Array.isArray(ent.items)) return null;
    if (Date.now() - ent.at > FEED_CACHE_TTL_MS) return null;
    return ent.items;
  } catch {
    return null;
  }
}

function writeFeedCache(
  filter: FeedFilter,
  type: FeedContentType,
  items: FeedItem[],
): void {
  if (typeof window === 'undefined') return;
  try {
    let store: FeedCacheStore = { v: 3, entries: {} };
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      if (
        p &&
        typeof p === 'object' &&
        'v' in p &&
        (p as FeedCacheStore).v === 3 &&
        'entries' in p &&
        typeof (p as FeedCacheStore).entries === 'object'
      ) {
        store = p as FeedCacheStore;
      }
    }
    store.entries[feedCacheEntryKey(filter, type)] = {
      at: Date.now(),
      items,
    };
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

function PersonPlusIcon({ color }: { color: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  );
}

function CommentBubbleIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function Avatar({
  url,
  name,
  size,
  onClick,
}: {
  url: string | null | undefined;
  name: string;
  size: number;
  onClick?: () => void;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const wrap: React.CSSProperties = {
    cursor: onClick ? 'pointer' : undefined,
    flexShrink: 0,
  };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        onClick={onClick}
        style={{
          ...wrap,
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        ...wrap,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: theme.colors.border,
        color: theme.colors.textSecondary,
        fontSize: size * 0.4,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {initial}
    </div>
  );
}

const MAX_FEED_PHOTO_BYTES = 4 * 1024 * 1024;

const FEED_OVERFLOW_BTN: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 14,
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.3)',
  fontSize: 18,
  cursor: 'pointer',
  padding: '4px 8px',
  lineHeight: 1,
  zIndex: 2,
};

function FeedOverflowMenuButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
      }}
      style={FEED_OVERFLOW_BTN}
    >
      ⋯
    </button>
  );
}

type FeedSheetAction = {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
};

function FeedActionBottomSheet({
  open,
  title,
  actions,
  onClose,
}: {
  open: boolean;
  title?: string;
  actions: FeedSheetAction[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 212,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      role="presentation"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radius.lg,
          borderTopRightRadius: theme.radius.lg,
          borderTop: `1px solid ${theme.colors.border}`,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Actions'}
      >
        {title ? (
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {title}
          </div>
        ) : null}
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => {
              a.onClick();
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '16px 18px',
              border: 'none',
              borderBottom: `1px solid ${theme.colors.border}`,
              background: 'none',
              color: a.danger ? theme.colors.error : theme.colors.textPrimary,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '16px 18px',
            border: 'none',
            background: 'none',
            color: theme.colors.textMuted,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function FeedConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  destructive,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 215,
        padding: 24,
      }}
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}`,
          padding: 24,
          maxWidth: 320,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="feed-confirm-title"
      >
        <h3
          id="feed-confirm-title"
          style={{
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: 600,
            margin: message ? '0 0 8px' : '0 0 20px',
          }}
        >
          {title}
        </h3>
        {message ? (
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: 14,
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textSecondary,
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: destructive ? theme.colors.error : theme.colors.primary,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedWorkoutMuscleMap({ item }: { item: FeedWorkoutItem }) {
  const ms = item.muscleSummary ?? {
    primary: [] as string[],
    secondary: [] as string[],
  };
  if (ms.primary.length === 0 && ms.secondary.length === 0) return null;
  return (
    <div style={{ marginBottom: '12px' }}>
      <MuscleMapLazy
        primaryMuscles={ms.primary}
        secondaryMuscles={ms.secondary}
        compact
      />
    </div>
  );
}

function PresetPostMuscleMap({
  preset,
}: {
  preset: NonNullable<FeedPostItem['preset']>;
}) {
  const ms = preset.muscleSummary ?? {
    primary: [] as string[],
    secondary: [] as string[],
  };
  if (ms.primary.length === 0 && ms.secondary.length === 0) return null;
  return (
    <div style={{ marginBottom: '12px' }}>
      <MuscleMapLazy
        primaryMuscles={ms.primary}
        secondaryMuscles={ms.secondary}
        compact
      />
    </div>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const { user: me } = useAuth();
  const [feedTab, setFeedTab] = useState<FeedFilter>('all');
  const [contentTab, setContentTab] = useState<FeedContentType>('all');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<CommentsTarget | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPostDraft, setEditPostDraft] = useState<{
    postId: string;
    text: string | null;
    photoUrl: string | null;
    preset: FeedPostItem['preset'];
  } | null>(null);
  const [postMenuPostId, setPostMenuPostId] = useState<string | null>(null);
  const [workoutMenuWorkoutId, setWorkoutMenuWorkoutId] = useState<
    string | null
  >(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<
    string | null
  >(null);
  const [confirmRemoveWorkoutPhotoId, setConfirmRemoveWorkoutPhotoId] =
    useState<string | null>(null);
  const [confirmHideWorkoutId, setConfirmHideWorkoutId] = useState<
    string | null
  >(null);
  const [feedExitKeys, setFeedExitKeys] = useState<Record<string, boolean>>(
    {},
  );
  const [deletingPost, setDeletingPost] = useState(false);
  const [workoutActionBusy, setWorkoutActionBusy] = useState<string | null>(
    null,
  );
  const workoutPhotoInputRef = useRef<HTMLInputElement>(null);
  const workoutPhotoTargetIdRef = useRef<string | null>(null);

  const load = useCallback(
    async (
      filter: FeedFilter,
      type: FeedContentType,
      opts?: { silent?: boolean },
    ) => {
      if (!opts?.silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const { data } = await fetchFeedApi(10, 0, filter, type);
        setItems(data);
        writeFeedCache(filter, type, data);
      } catch (e) {
        if (!opts?.silent) {
          setError(e instanceof Error ? e.message : 'Failed to load feed');
        }
      } finally {
        if (!opts?.silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const cached = readValidCachedFeed(feedTab, contentTab);
    if (cached) {
      setItems(cached);
      setLoading(false);
      setError(null);
      void load(feedTab, contentTab, { silent: true });
    } else {
      setItems([]);
      void load(feedTab, contentTab);
    }
  }, [feedTab, contentTab, load]);

  async function handleWorkoutLike(workoutId: string) {
    hapticImpactLight();
    const prev = items;
    const idx = prev.findIndex(
      (i) => i.type === 'workout' && i.workoutId === workoutId,
    );
    if (idx < 0) return;
    const cur = prev[idx];
    if (cur.type !== 'workout') return;
    const nextLiked = !cur.likedByMe;
    const nextCount = cur.likeCount + (nextLiked ? 1 : -1);
    setItems(
      prev.map((it, i) =>
        i === idx && it.type === 'workout'
          ? {
              ...it,
              likedByMe: nextLiked,
              likeCount: Math.max(0, nextCount),
            }
          : it,
      ),
    );
    try {
      const res = await toggleWorkoutLikeApi(workoutId);
      setItems((p) =>
        p.map((it) =>
          it.type === 'workout' && it.workoutId === workoutId
            ? {
                ...it,
                likedByMe: res.liked,
                likeCount: res.likeCount,
              }
            : it,
        ),
      );
    } catch {
      setItems(prev);
    }
  }

  async function handlePostLike(postId: string) {
    hapticImpactLight();
    const prev = items;
    const idx = prev.findIndex((i) => i.type === 'post' && i.postId === postId);
    if (idx < 0) return;
    const cur = prev[idx];
    if (cur.type !== 'post') return;
    const nextLiked = !cur.likedByMe;
    const nextCount = cur.likeCount + (nextLiked ? 1 : -1);
    setItems(
      prev.map((it, i) =>
        i === idx && it.type === 'post'
          ? {
              ...it,
              likedByMe: nextLiked,
              likeCount: Math.max(0, nextCount),
            }
          : it,
      ),
    );
    try {
      const res = await togglePostLikeApi(postId);
      setItems((p) =>
        p.map((it) =>
          it.type === 'post' && it.postId === postId
            ? {
                ...it,
                likedByMe: res.liked,
                likeCount: res.likeCount,
              }
            : it,
        ),
      );
    } catch {
      setItems(prev);
    }
  }

  function openComments(target: CommentsTarget) {
    setCommentTarget(target);
    setSheetOpen(true);
  }

  function onCommentPosted(row: WorkoutCommentRow, ctx: CommentsTarget) {
    setItems((prev) =>
      prev.map((it) => {
        if (ctx.kind === 'workout') {
          if (it.type !== 'workout' || it.workoutId !== ctx.id) return it;
          const previews = [
            {
              id: row.id,
              userId: row.userId,
              userName: row.userName,
              userAvatarUrl: row.userAvatarUrl,
              text: row.text,
              createdAt: row.createdAt,
            },
            ...it.commentPreviews,
          ].slice(0, 2);
          return {
            ...it,
            commentCount: it.commentCount + 1,
            commentPreviews: previews,
          };
        }
        if (it.type !== 'post' || it.postId !== ctx.id) return it;
        const previews = [
          {
            id: row.id,
            userId: row.userId,
            userName: row.userName,
            userAvatarUrl: row.userAvatarUrl,
            text: row.text,
            createdAt: row.createdAt,
          },
          ...it.commentPreviews,
        ].slice(0, 2);
        return {
          ...it,
          commentCount: it.commentCount + 1,
          commentPreviews: previews,
        };
      }),
    );
  }

  async function handleSavePreset(presetId: string) {
    hapticImpactLight();
    try {
      await savePresetCopyApi(presetId);
      setItems((prev) =>
        prev.map((it) =>
          it.type === 'post' && it.preset?.id === presetId
            ? { ...it, savedByMe: true }
            : it,
        ),
      );
    } catch {
      /* keep UI stable */
    }
  }

  function animateOutFeedKey(key: string, remove: () => void) {
    setFeedExitKeys((m) => ({ ...m, [key]: true }));
    window.setTimeout(() => {
      remove();
      setFeedExitKeys((m) => {
        const n = { ...m };
        delete n[key];
        return n;
      });
    }, 300);
  }

  async function runDeletePost() {
    if (!confirmDeletePostId || deletingPost) return;
    const id = confirmDeletePostId;
    setDeletingPost(true);
    hapticNotificationWarning();
    try {
      await deleteCommunityPostApi(id);
      setConfirmDeletePostId(null);
      animateOutFeedKey(`p-${id}`, () =>
        setItems((prev) =>
          prev.filter((it) => !(it.type === 'post' && it.postId === id)),
        ),
      );
    } catch {
      /* card stays */
    } finally {
      setDeletingPost(false);
    }
  }

  async function runRemoveWorkoutPhoto() {
    if (!confirmRemoveWorkoutPhotoId || workoutActionBusy) return;
    const id = confirmRemoveWorkoutPhotoId;
    setWorkoutActionBusy(id);
    hapticNotificationWarning();
    try {
      await patchWorkoutForFeedApi(id, { photoUrl: null });
      setConfirmRemoveWorkoutPhotoId(null);
      setItems((prev) =>
        prev.map((it) =>
          it.type === 'workout' && it.workoutId === id
            ? { ...it, photoUrl: null }
            : it,
        ),
      );
    } catch {
      /* unchanged */
    } finally {
      setWorkoutActionBusy(null);
    }
  }

  async function runHideWorkoutFromFeed() {
    if (!confirmHideWorkoutId || workoutActionBusy) return;
    const id = confirmHideWorkoutId;
    setWorkoutActionBusy(id);
    hapticNotificationWarning();
    try {
      await patchWorkoutForFeedApi(id, { isPublic: false });
      setConfirmHideWorkoutId(null);
      animateOutFeedKey(`w-${id}`, () =>
        setItems((prev) =>
          prev.filter((it) => !(it.type === 'workout' && it.workoutId === id)),
        ),
      );
    } catch {
      /* stays visible */
    } finally {
      setWorkoutActionBusy(null);
    }
  }

  async function onWorkoutPhotoPicked(file: File, workoutId: string) {
    if (!file.type.startsWith('image/') || file.size > MAX_FEED_PHOTO_BYTES) {
      return;
    }
    setWorkoutActionBusy(workoutId);
    try {
      const compressed = await compressImage(file);
      const url = await uploadWorkoutPhotoApi(compressed);
      const data = await patchWorkoutForFeedApi(workoutId, { photoUrl: url });
      setItems((prev) =>
        prev.map((it) =>
          it.type === 'workout' && it.workoutId === workoutId
            ? { ...it, photoUrl: data.photoUrl }
            : it,
        ),
      );
    } catch {
      /* keep previous photo */
    } finally {
      setWorkoutActionBusy(null);
    }
  }

  const postMenuItem = postMenuPostId
    ? items.find(
        (i): i is FeedPostItem =>
          i.type === 'post' && i.postId === postMenuPostId,
      )
    : undefined;

  const workoutMenuItem = workoutMenuWorkoutId
    ? items.find(
        (i): i is FeedWorkoutItem =>
          i.type === 'workout' && i.workoutId === workoutMenuWorkoutId,
      )
    : undefined;

  const emptyFollowingCopy =
    'Your Following feed is empty. Follow people to see their public workouts and posts here.';
  const emptyFeedWorkoutsCopy =
    'No public workouts to show yet. Check back later or invite friends.';
  const emptyFeedPostsCopy =
    'No posts yet. Tap + Create Post to share a workout thought or photo.';
  const emptyFeedAllCopy =
    'Nothing in the feed yet. Finish a public workout or start a post.';

  function emptyCopy(): string {
    if (feedTab === 'following') return emptyFollowingCopy;
    if (contentTab === 'workout') return emptyFeedWorkoutsCopy;
    if (contentTab === 'post') return emptyFeedPostsCopy;
    return emptyFeedAllCopy;
  }

  return (
    <div style={{ paddingTop: '12px', paddingBottom: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
            flexShrink: 0,
          }}
        >
          Community
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              padding: '8px 24px',
              minWidth: '160px',
              borderRadius: theme.radius.md,
              border: `1.5px solid ${theme.colors.primary}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.primary,
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            + Create Post
          </button>
          <button
            type="button"
            onClick={() => router.push('/community/search')}
            aria-label="Search people"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <PersonPlusIcon color={theme.colors.textMuted} />
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Community feed scope"
        style={{
          display: 'flex',
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '12px',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={feedTab === 'all'}
          onClick={() => setFeedTab('all')}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            backgroundColor:
              feedTab === 'all' ? theme.colors.primary : theme.colors.surface,
            color:
              feedTab === 'all'
                ? theme.colors.textPrimary
                : theme.colors.textMuted,
          }}
        >
          Feed
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={feedTab === 'following'}
          onClick={() => setFeedTab('following')}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: 'none',
            borderLeft: `1px solid ${theme.colors.border}`,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            backgroundColor:
              feedTab === 'following'
                ? theme.colors.primary
                : theme.colors.surface,
            color:
              feedTab === 'following'
                ? theme.colors.textPrimary
                : theme.colors.textMuted,
          }}
        >
          Following
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Feed content type"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            { key: 'all' as const, label: 'All' },
            { key: 'workout' as const, label: 'Workouts' },
            { key: 'post' as const, label: 'Posts' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={contentTab === key}
            onClick={() => setContentTab(key)}
            style={{
              padding: '8px 14px',
              borderRadius: theme.radius.md,
              border: `1px solid ${
                contentTab === key ? theme.colors.primary : theme.colors.border
              }`,
              backgroundColor:
                contentTab === key ? theme.colors.primary : theme.colors.surface,
              color:
                contentTab === key
                  ? theme.colors.textPrimary
                  : theme.colors.textMuted,
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: theme.colors.textMuted }}>Loading feed…</p>
      )}
      {error && (
        <p style={{ color: theme.colors.error, marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <Card>
          <p
            style={{
              color: theme.colors.textSecondary,
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            {emptyCopy()}
          </p>
          {feedTab === 'following' && (
            <Link
              href="/community/search"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                color: theme.colors.primary,
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Search users
            </Link>
          )}
        </Card>
      )}

      {!loading &&
        items.map((item) =>
          item.type === 'workout' ? (
            <div
              key={`w-${item.workoutId}`}
              style={{
                marginBottom: '14px',
                opacity: feedExitKeys[`w-${item.workoutId}`] ? 0 : 1,
                transform: feedExitKeys[`w-${item.workoutId}`]
                  ? 'scale(0.96)'
                  : undefined,
                transition: 'opacity 0.28s ease, transform 0.28s ease',
              }}
            >
              <Card
                style={{
                  position: 'relative',
                  marginBottom: 0,
                }}
              >
                {me?.id === item.user.id ? (
                  <FeedOverflowMenuButton
                    label="Workout actions"
                    onClick={() => setWorkoutMenuWorkoutId(item.workoutId)}
                  />
                ) : null}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: item.photoUrl ? '12px' : '8px',
                  }}
                >
                <Avatar
                  url={item.user.avatarUrl}
                  name={item.user.name}
                  size={40}
                  onClick={() => router.push(`/profile/${item.user.id}`)}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/profile/${item.user.id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      color: theme.colors.textPrimary,
                      fontWeight: 600,
                      fontSize: '15px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {item.user.name}
                  </button>
                  <div
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '12px',
                      marginTop: '2px',
                    }}
                  >
                    {formatTimeAgo(item.postedAt)}
                  </div>
                </div>
              </div>

              {item.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoUrl}
                  alt=""
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    objectFit: 'cover',
                    borderRadius: theme.radius.md,
                    marginBottom: '12px',
                    display: 'block',
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    color: theme.colors.textPrimary,
                    fontWeight: 700,
                    fontSize: '16px',
                  }}
                >
                  {item.name}
                </span>
                {item.hasPr && (
                  <span
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.15)',
                      color: theme.colors.warning,
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    PR
                  </span>
                )}
              </div>

              <p
                style={{
                  margin: '0 0 12px',
                  color: theme.colors.textSecondary,
                  fontSize: '13px',
                }}
              >
                {formatFeedDuration(item.durationSec)}
                <span style={{ margin: '0 6px', color: theme.colors.border }}>
                  ·
                </span>
                {item.totalSets} sets
                <span style={{ margin: '0 6px', color: theme.colors.border }}>
                  ·
                </span>
                {item.totalVolume.toLocaleString('en-US')} kg vol.
              </p>

              <FeedWorkoutMuscleMap item={item} />

              {item.log.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '8px',
                    }}
                  >
                    Workout log
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {item.log.map((line, li) => (
                      <WorkoutLogExerciseRow
                        key={`${item.workoutId}-log-${li}`}
                        exerciseImageUrl={line.exerciseImageUrl}
                        exerciseName={line.exerciseName}
                        completedSets={line.completedSets}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: item.commentPreviews.length ? '10px' : 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleWorkoutLike(item.workoutId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: item.likedByMe
                      ? theme.colors.primary
                      : theme.colors.textMuted,
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <span aria-hidden>{item.likedByMe ? '♥' : '♡'}</span>
                  {item.likeCount}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openComments({ kind: 'workout', id: item.workoutId })
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: theme.colors.textMuted,
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <CommentBubbleIcon color="currentColor" />
                  {item.commentCount}
                </button>
              </div>

              {item.commentPreviews.length > 0 && (
                <div
                  style={{
                    borderTop: `1px solid ${theme.colors.border}`,
                    paddingTop: '10px',
                  }}
                >
                  {item.commentPreviews.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <Avatar url={c.userAvatarUrl} name={c.userName} size={28} />
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: theme.colors.textPrimary,
                          }}
                        >
                          {c.userName}
                        </span>
                        <span style={{ color: theme.colors.textSecondary }}>
                          {' '}
                          {c.text}
                        </span>
                      </div>
                    </div>
                  ))}
                  {item.commentCount > item.commentPreviews.length && (
                    <button
                      type="button"
                      onClick={() =>
                        openComments({ kind: 'workout', id: item.workoutId })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: theme.colors.primary,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      View all
                    </button>
                  )}
                </div>
              )}
              </Card>
            </div>
          ) : (
            <div
              key={`p-${item.postId}`}
              style={{
                marginBottom: '14px',
                opacity: feedExitKeys[`p-${item.postId}`] ? 0 : 1,
                transform: feedExitKeys[`p-${item.postId}`]
                  ? 'scale(0.96)'
                  : undefined,
                transition: 'opacity 0.28s ease, transform 0.28s ease',
              }}
            >
              <PostFeedCard
                item={item}
                meId={me?.id}
                onSavePreset={handleSavePreset}
                onLike={() => void handlePostLike(item.postId)}
                onOpenComments={() =>
                  openComments({ kind: 'post', id: item.postId })
                }
                onOpenPostMenu={() => setPostMenuPostId(item.postId)}
                router={router}
              />
            </div>
          ),
        )}

      <CommunityCommentsSheet
        target={commentTarget}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setCommentTarget(null);
        }}
        onCommentPosted={onCommentPosted}
      />

      <input
        ref={workoutPhotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          const wid = workoutPhotoTargetIdRef.current;
          workoutPhotoTargetIdRef.current = null;
          if (!f || !wid) return;
          void onWorkoutPhotoPicked(f, wid);
        }}
      />

      <FeedActionBottomSheet
        open={postMenuPostId !== null}
        onClose={() => setPostMenuPostId(null)}
        actions={
          postMenuItem
            ? [
                {
                  key: 'edit',
                  label: 'Edit Post',
                  onClick: () => {
                    setPostMenuPostId(null);
                    setEditPostDraft({
                      postId: postMenuItem.postId,
                      text: postMenuItem.text,
                      photoUrl: postMenuItem.photoUrl,
                      preset: postMenuItem.preset,
                    });
                  },
                },
                {
                  key: 'delete',
                  label: 'Delete Post',
                  danger: true,
                  onClick: () => {
                    setPostMenuPostId(null);
                    setConfirmDeletePostId(postMenuItem.postId);
                  },
                },
              ]
            : []
        }
      />

      <FeedActionBottomSheet
        open={workoutMenuWorkoutId !== null}
        onClose={() => setWorkoutMenuWorkoutId(null)}
        actions={
          workoutMenuItem
            ? [
                {
                  key: 'photo',
                  label: 'Change Photo',
                  onClick: () => {
                    setWorkoutMenuWorkoutId(null);
                    workoutPhotoTargetIdRef.current =
                      workoutMenuItem.workoutId;
                    requestAnimationFrame(() =>
                      workoutPhotoInputRef.current?.click(),
                    );
                  },
                },
                ...(workoutMenuItem.photoUrl
                  ? [
                      {
                        key: 'remove-photo',
                        label: 'Remove Photo',
                        danger: true as const,
                        onClick: () => {
                          setWorkoutMenuWorkoutId(null);
                          setConfirmRemoveWorkoutPhotoId(
                            workoutMenuItem.workoutId,
                          );
                        },
                      },
                    ]
                  : []),
                {
                  key: 'hide',
                  label: 'Delete from feed',
                  danger: true,
                  onClick: () => {
                    setWorkoutMenuWorkoutId(null);
                    setConfirmHideWorkoutId(workoutMenuItem.workoutId);
                  },
                },
              ]
            : []
        }
      />

      <FeedConfirmModal
        open={confirmDeletePostId !== null}
        title="Delete this post?"
        message="This cannot be undone."
        confirmLabel={deletingPost ? 'Deleting…' : 'Delete'}
        destructive
        busy={deletingPost}
        onCancel={() => !deletingPost && setConfirmDeletePostId(null)}
        onConfirm={() => void runDeletePost()}
      />

      <FeedConfirmModal
        open={confirmRemoveWorkoutPhotoId !== null}
        title="Remove photo from this workout?"
        message=""
        confirmLabel={
          workoutActionBusy ? 'Removing…' : 'Remove'
        }
        destructive
        busy={Boolean(
          confirmRemoveWorkoutPhotoId &&
            workoutActionBusy === confirmRemoveWorkoutPhotoId,
        )}
        onCancel={() =>
          workoutActionBusy === null && setConfirmRemoveWorkoutPhotoId(null)
        }
        onConfirm={() => void runRemoveWorkoutPhoto()}
      />

      <FeedConfirmModal
        open={confirmHideWorkoutId !== null}
        title="Hide this workout from Community?"
        message="It will stay in your History."
        confirmLabel={
          workoutActionBusy ? 'Hiding…' : 'Hide'
        }
        destructive
        busy={Boolean(
          confirmHideWorkoutId &&
            workoutActionBusy === confirmHideWorkoutId,
        )}
        onCancel={() =>
          workoutActionBusy === null && setConfirmHideWorkoutId(null)
        }
        onConfirm={() => void runHideWorkoutFromFeed()}
      />

      <CreatePostSheet
        open={createOpen || editPostDraft !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditPostDraft(null);
        }}
        editInitial={editPostDraft}
        onPosted={() => void load(feedTab, contentTab)}
        onSavedEdit={(payload) => {
          setItems((prev) =>
            prev.map((it) =>
              it.type === 'post' && it.postId === payload.postId
                ? {
                    ...it,
                    text: payload.text,
                    photoUrl: payload.photoUrl,
                    preset: payload.preset,
                    savedByMe: payload.savedByMe,
                  }
                : it,
            ),
          );
          setEditPostDraft(null);
        }}
      />
    </div>
  );
}

function PostFeedCard({
  item,
  meId,
  onSavePreset,
  onLike,
  onOpenComments,
  onOpenPostMenu,
  router,
}: {
  item: FeedPostItem;
  meId: string | undefined;
  onSavePreset: (presetId: string) => void;
  onLike: () => void;
  onOpenComments: () => void;
  onOpenPostMenu: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const showSavePreset =
    item.preset &&
    item.user.id !== meId &&
    !item.savedByMe;

  const isOwner = meId != null && item.user.id === meId;

  return (
    <Card style={{ position: 'relative', marginBottom: 0 }}>
      {isOwner ? (
        <FeedOverflowMenuButton
          label="Post actions"
          onClick={onOpenPostMenu}
        />
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom:
            item.photoUrl || item.text || item.preset ? '12px' : '8px',
        }}
      >
        <Avatar
          url={item.user.avatarUrl}
          name={item.user.name}
          size={40}
          onClick={() => router.push(`/profile/${item.user.id}`)}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => router.push(`/profile/${item.user.id}`)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              color: theme.colors.textPrimary,
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {item.user.name}
          </button>
          <div
            style={{
              color: theme.colors.textMuted,
              fontSize: '12px',
              marginTop: '2px',
            }}
          >
            {formatTimeAgo(item.postedAt)}
          </div>
        </div>
      </div>

      {item.text ? (
        <p
          style={{
            margin: '0 0 12px',
            color: theme.colors.textPrimary,
            fontSize: '15px',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {item.text}
        </p>
      ) : null}

      {item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photoUrl}
          alt=""
          style={{
            width: '100%',
            maxHeight: '220px',
            objectFit: 'cover',
            borderRadius: theme.radius.md,
            marginBottom: '12px',
            display: 'block',
          }}
        />
      ) : null}

      {item.preset ? (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px 14px',
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.card,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '15px',
              color: theme.colors.textPrimary,
              marginBottom: '6px',
            }}
          >
            {item.preset.name}
          </div>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: '13px',
              color: theme.colors.textMuted,
            }}
          >
            {item.preset.exerciseCount} exercises
          </p>
          {item.preset.exerciseNames.length > 0 && (
            <ul
              style={{
                margin: '0 0 10px',
                paddingLeft: '18px',
                color: theme.colors.textSecondary,
                fontSize: '13px',
              }}
            >
              {item.preset.exerciseNames.map((n, i) => (
                <li key={`${item.postId}-ex-${i}`} style={{ marginBottom: '4px' }}>
                  {n}
                </li>
              ))}
            </ul>
          )}
          {showSavePreset ? (
            <button
              type="button"
              onClick={() => onSavePreset(item.preset!.id)}
              style={{
                padding: '8px 14px',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.primary}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.primary,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Save Preset
            </button>
          ) : item.preset && item.savedByMe ? (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: theme.colors.primary,
              }}
            >
              Saved ✓
            </span>
          ) : null}
        </div>
      ) : null}

      {item.preset ? <PresetPostMuscleMap preset={item.preset} /> : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: item.commentPreviews.length ? '10px' : 0,
        }}
      >
        <button
          type="button"
          onClick={onLike}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: item.likedByMe
              ? theme.colors.primary
              : theme.colors.textMuted,
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <span aria-hidden>{item.likedByMe ? '♥' : '♡'}</span>
          {item.likeCount}
        </button>
        <button
          type="button"
          onClick={onOpenComments}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: theme.colors.textMuted,
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <CommentBubbleIcon color="currentColor" />
          {item.commentCount}
        </button>
      </div>

      {item.commentPreviews.length > 0 && (
        <div
          style={{
            borderTop: `1px solid ${theme.colors.border}`,
            paddingTop: '10px',
          }}
        >
          {item.commentPreviews.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              <Avatar url={c.userAvatarUrl} name={c.userName} size={28} />
              <div style={{ minWidth: 0 }}>
                <span
                  style={{ fontWeight: 600, color: theme.colors.textPrimary }}
                >
                  {c.userName}
                </span>
                <span style={{ color: theme.colors.textSecondary }}>
                  {' '}
                  {c.text}
                </span>
              </div>
            </div>
          ))}
          {item.commentCount > item.commentPreviews.length && (
            <button
              type="button"
              onClick={onOpenComments}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: theme.colors.primary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View all
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
