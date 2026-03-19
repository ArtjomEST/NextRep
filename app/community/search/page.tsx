'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import {
  searchUsersApi,
  followUserApi,
  unfollowUserApi,
} from '@/lib/api/client';
import type { UserSearchHit } from '@/lib/api/types';

export default function CommunitySearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<UserSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const runSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchUsersApi(query);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(debounced);
  }, [debounced, runSearch]);

  async function toggleFollow(hit: UserSearchHit) {
    if (hit.isSelf) return;
    const next = !hit.isFollowing;
    setResults((prev) =>
      prev.map((r) =>
        r.id === hit.id ? { ...r, isFollowing: next } : r,
      ),
    );
    try {
      if (next) await followUserApi(hit.id);
      else await unfollowUserApi(hit.id);
    } catch {
      setResults((prev) =>
        prev.map((r) =>
          r.id === hit.id ? { ...r, isFollowing: hit.isFollowing } : r,
        ),
      );
    }
  }

  return (
    <div style={{ paddingTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
          }}
          aria-label="Back"
        >
          ←
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}
        >
          Find people
        </h1>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name…"
        autoFocus
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 14px',
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.card,
          color: theme.colors.textPrimary,
          fontSize: '15px',
          marginBottom: '12px',
        }}
      />

      <p style={{ color: theme.colors.textMuted, fontSize: '12px', margin: '0 0 12px' }}>
        Type at least 2 characters.
      </p>

      {loading && (
        <p style={{ color: theme.colors.textMuted }}>Searching…</p>
      )}
      {error && (
        <p style={{ color: theme.colors.error }}>{error}</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {results.map((hit) => (
          <li
            key={hit.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <Link
              href={`/profile/${hit.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                minWidth: 0,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {hit.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hit.avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: theme.colors.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {hit.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                style={{
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  fontSize: '15px',
                }}
              >
                {hit.name}
              </span>
            </Link>
            {hit.isSelf ? (
              <span style={{ color: theme.colors.textMuted, fontSize: '13px' }}>
                You
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void toggleFollow(hit)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: theme.radius.md,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  backgroundColor: hit.isFollowing
                    ? theme.colors.border
                    : theme.colors.primary,
                  color: hit.isFollowing
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                }}
              >
                {hit.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
