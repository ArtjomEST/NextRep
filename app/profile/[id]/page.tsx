'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import {
  fetchPublicProfileApi,
  followUserApi,
  unfollowUserApi,
} from '@/lib/api/client';
import type { PublicProfileData } from '@/lib/api/types';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await fetchPublicProfileApi(id);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFollow() {
    if (!data || data.isSelf) return;
    const prev = data;
    const nextFollow = !prev.isFollowing;
    setData({
      ...prev,
      isFollowing: nextFollow,
      followerCount: prev.followerCount + (nextFollow ? 1 : -1),
    });
    try {
      if (nextFollow) await followUserApi(id);
      else await unfollowUserApi(id);
    } catch {
      setData(prev);
    }
  }

  if (loading) {
    return (
      <p style={{ color: theme.colors.textMuted, paddingTop: '24px' }}>
        Loading…
      </p>
    );
  }

  if (error || !data) {
    return (
      <p style={{ color: theme.colors.error, paddingTop: '24px' }}>
        {error ?? 'Not found'}
      </p>
    );
  }

  const u = data.user;

  return (
    <div style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.textMuted,
          fontSize: '22px',
          cursor: 'pointer',
          padding: '4px 0 16px',
          lineHeight: 1,
        }}
        aria-label="Back"
      >
        ←
      </button>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {u.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={u.avatarUrl}
            alt=""
            width={88}
            height={88}
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 12px',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              backgroundColor: theme.colors.border,
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              color: theme.colors.textSecondary,
            }}
          >
            {u.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}
        >
          {u.name}
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            color: theme.colors.textMuted,
            fontSize: '14px',
          }}
        >
          {data.followerCount} followers · {data.followingCount} following
        </p>
        {!data.isSelf && (
          <button
            type="button"
            onClick={() => void toggleFollow()}
            style={{
              marginTop: '14px',
              padding: '10px 28px',
              borderRadius: theme.radius.md,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              backgroundColor: data.isFollowing
                ? theme.colors.border
                : theme.colors.primary,
              color: data.isFollowing
                ? theme.colors.textSecondary
                : theme.colors.textPrimary,
            }}
          >
            {data.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.md,
            padding: '14px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              color: theme.colors.textMuted,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Workouts
          </div>
          <div
            style={{
              color: theme.colors.textPrimary,
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {data.totalWorkouts}
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.md,
            padding: '14px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              color: theme.colors.textMuted,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Volume
          </div>
          <div
            style={{
              color: theme.colors.textPrimary,
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {data.totalVolume.toLocaleString('en-US')} kg
          </div>
        </div>
      </div>

      <h2
        style={{
          margin: '0 0 12px',
          fontSize: '15px',
          fontWeight: 700,
          color: theme.colors.textPrimary,
        }}
      >
        Public workouts
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.publicWorkouts.length === 0 && (
          <p style={{ color: theme.colors.textMuted, fontSize: '14px' }}>
            No public workouts yet.
          </p>
        )}
        {data.publicWorkouts.map((w) => (
          <div
            key={w.id}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {w.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={w.photoUrl}
                alt=""
                width={56}
                height={56}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.radius.sm,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.border,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  fontSize: '15px',
                  marginBottom: '4px',
                }}
              >
                {w.name}
              </div>
              <div
                style={{
                  color: theme.colors.textMuted,
                  fontSize: '12px',
                }}
              >
                {new Date(w.endedAt).toLocaleDateString()} · {w.totalSets} sets ·{' '}
                {w.totalVolume.toLocaleString('en-US')} kg
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
