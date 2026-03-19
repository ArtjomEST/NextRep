'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import {
  fetchFeedApi,
  toggleWorkoutLikeApi,
  type FeedFilter,
} from '@/lib/api/client';
import type { FeedItem, WorkoutCommentRow } from '@/lib/api/types';
import { formatTimeAgo, formatFeedDuration } from '@/lib/community/time';
import { hapticImpactLight } from '@/lib/telegram/haptic';
import CommunityCommentsSheet from '@/components/CommunityCommentsSheet';
import Card from '@/components/Card';

function SearchIcon({ color }: { color: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
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

export default function CommunityPage() {
  const router = useRouter();
  const [feedTab, setFeedTab] = useState<FeedFilter>('all');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetWorkoutId, setSheetWorkoutId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async (filter: FeedFilter) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchFeedApi(30, 0, filter);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(feedTab);
  }, [feedTab, load]);

  async function handleLike(workoutId: string) {
    hapticImpactLight();
    const prev = items;
    const idx = prev.findIndex((i) => i.workoutId === workoutId);
    if (idx < 0) return;
    const cur = prev[idx];
    const nextLiked = !cur.likedByMe;
    const nextCount = cur.likeCount + (nextLiked ? 1 : -1);
    setItems(
      prev.map((it, i) =>
        i === idx
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
          it.workoutId === workoutId
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

  function openComments(workoutId: string) {
    setSheetWorkoutId(workoutId);
    setSheetOpen(true);
  }

  function onCommentPosted(row: WorkoutCommentRow) {
    if (!sheetWorkoutId) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.workoutId !== sheetWorkoutId) return it;
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

  const emptyFollowingCopy =
    'Your Following feed is empty. Follow people to see their public workouts here.';
  const emptyFeedCopy =
    'No public workouts to show yet. Check back later or invite friends.';

  return (
    <div style={{ paddingTop: '12px', paddingBottom: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}
        >
          Community
        </h1>
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
          <SearchIcon color={theme.colors.textMuted} />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Community feed scope"
        style={{
          display: 'flex',
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '16px',
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
            {feedTab === 'following' ? emptyFollowingCopy : emptyFeedCopy}
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
        items.map((item) => (
          <Card key={item.workoutId} style={{ marginBottom: '14px' }}>
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
                    <div
                      key={`${item.workoutId}-log-${li}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      {line.exerciseImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.exerciseImageUrl}
                          alt=""
                          width={32}
                          height={32}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: theme.radius.sm,
                            objectFit: 'cover',
                            backgroundColor: theme.colors.card,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: theme.radius.sm,
                            backgroundColor: theme.colors.border,
                          }}
                        />
                      )}
                      <span
                        style={{
                          flex: 1,
                          color: theme.colors.textPrimary,
                          fontSize: '14px',
                          minWidth: 0,
                        }}
                      >
                        {line.exerciseName}
                      </span>
                      <span
                        style={{
                          color: theme.colors.textMuted,
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {line.completedSets} sets
                      </span>
                    </div>
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
                onClick={() => void handleLike(item.workoutId)}
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
                onClick={() => openComments(item.workoutId)}
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
                      <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>
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
                    onClick={() => openComments(item.workoutId)}
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
        ))}

      <CommunityCommentsSheet
        workoutId={sheetWorkoutId}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetWorkoutId(null);
        }}
        onCommentPosted={onCommentPosted}
      />
    </div>
  );
}
