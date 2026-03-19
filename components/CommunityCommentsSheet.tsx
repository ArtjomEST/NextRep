'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  fetchWorkoutCommentsApi,
  postWorkoutCommentApi,
} from '@/lib/api/client';
import type { WorkoutCommentRow } from '@/lib/api/types';
import { formatTimeAgo } from '@/lib/community/time';
import Button from '@/components/Button';

function Avatar({
  url,
  name,
  size,
}: {
  url: string | null | undefined;
  name: string;
  size: number;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
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
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export default function CommunityCommentsSheet({
  workoutId,
  open,
  onClose,
  onCommentPosted,
}: {
  workoutId: string | null;
  open: boolean;
  onClose: () => void;
  onCommentPosted: (row: WorkoutCommentRow) => void;
}) {
  const [rows, setRows] = useState<WorkoutCommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workoutId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchWorkoutCommentsApi(workoutId, 80, 0);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    if (open && workoutId) {
      void load();
      setText('');
    }
  }, [open, workoutId, load]);

  async function handlePost() {
    if (!workoutId || posting) return;
    const t = text.trim();
    if (!t) return;
    setPosting(true);
    setError(null);
    try {
      const row = await postWorkoutCommentApi(workoutId, t);
      setRows((prev) => [...prev, row]);
      setText('');
      onCommentPosted(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
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
          maxHeight: '78vh',
          display: 'flex',
          flexDirection: 'column',
          borderTop: `1px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <span
            style={{
              color: theme.colors.textPrimary,
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            Comments
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.textMuted,
              fontSize: '22px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            minHeight: '180px',
          }}
        >
          {loading && (
            <p style={{ color: theme.colors.textMuted, margin: 0 }}>
              Loading…
            </p>
          )}
          {!loading && rows.length === 0 && (
            <p style={{ color: theme.colors.textMuted, margin: 0 }}>
              No comments yet. Say something nice!
            </p>
          )}
          {!loading &&
            rows.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <Avatar url={r.userAvatarUrl} name={r.userName} size={36} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: theme.colors.textPrimary,
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      {r.userName}
                    </span>
                    <span
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: '12px',
                      }}
                    >
                      {formatTimeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: '14px',
                      margin: '4px 0 0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {r.text}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {error && (
          <div
            style={{
              padding: '0 16px 8px',
              color: theme.colors.error,
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
            backgroundColor: theme.colors.surface,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder="Add a comment…"
            rows={2}
            style={{
              flex: 1,
              resize: 'none',
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.card,
              color: theme.colors.textPrimary,
              fontSize: '14px',
              padding: '10px 12px',
              fontFamily: 'inherit',
            }}
          />
          <Button size="sm" onClick={() => void handlePost()} disabled={posting}>
            {posting ? '…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
