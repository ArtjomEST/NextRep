'use client';

import React, { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  createCommunityPostApi,
  fetchPresetsApi,
  uploadWorkoutPhotoApi,
  UploadPhotoError,
} from '@/lib/api/client';
import type { Preset } from '@/lib/api/types';
import Button from '@/components/Button';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export default function CreatePostSheet({
  open,
  onClose,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
}) {
  const [text, setText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [presetPicker, setPresetPicker] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!open) return;
    setText('');
    setPhotoFile(null);
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreset(null);
    setPresetPicker(false);
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open || !presetPicker) return;
    let cancelled = false;
    setLoadingPresets(true);
    void fetchPresetsApi()
      .then((data) => {
        if (!cancelled) setPresets(data);
      })
      .catch(() => {
        if (!cancelled) setPresets([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPresets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, presetPicker]);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > MAX_PHOTO_BYTES) {
      setError('Photo is too large. Please choose an image under 4MB.');
      return;
    }
    setError(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(f);
    setPhotoPreviewUrl(URL.createObjectURL(f));
  }

  function clearPhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  const canPost =
    text.trim().length > 0 || !!photoFile || !!preset;

  async function handleSubmit() {
    if (!canPost || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        if (photoFile.size > MAX_PHOTO_BYTES) {
          setError('Photo is too large. Please choose an image under 4MB.');
          setSubmitting(false);
          return;
        }
        try {
          photoUrl = await uploadWorkoutPhotoApi(photoFile);
        } catch (uploadErr) {
          if (uploadErr instanceof UploadPhotoError) {
            setError(uploadErr.message);
            setSubmitting(false);
            return;
          }
          throw uploadErr;
        }
      }

      await createCommunityPostApi({
        text: text.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
        presetId: preset?.id ?? undefined,
      });

      onPosted?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 210,
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
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderTop: `1px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="New post"
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
            New post
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

        {presetPicker ? (
          <div
            style={{
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setPresetPicker(false)}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.primary,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                padding: '0 0 12px',
              }}
            >
              ← Back
            </button>
            {loadingPresets && (
              <p style={{ color: theme.colors.textMuted }}>Loading presets…</p>
            )}
            {!loadingPresets && presets.length === 0 && (
              <p style={{ color: theme.colors.textMuted }}>
                No presets yet. Create one from your account.
              </p>
            )}
            {!loadingPresets &&
              presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPreset(p);
                    setPresetPicker(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    marginBottom: '8px',
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.card,
                    color: theme.colors.textPrimary,
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  {p.name}
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 400,
                      fontSize: '12px',
                      color: theme.colors.textMuted,
                      marginTop: '4px',
                    }}
                  >
                    {p.exerciseIds.length} exercises
                  </span>
                </button>
              ))}
          </div>
        ) : (
          <div
            style={{
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                fontSize: '15px',
                padding: '12px 14px',
                fontFamily: 'inherit',
                minHeight: '100px',
              }}
            />

            {photoPreviewUrl && (
              <div style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreviewUrl}
                  alt=""
                  style={{
                    width: '100%',
                    maxHeight: '160px',
                    objectFit: 'cover',
                    borderRadius: theme.radius.md,
                  }}
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Remove photo"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {preset && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.primary}`,
                  backgroundColor: theme.colors.card,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    minWidth: 0,
                  }}
                >
                  {preset.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPreset(null)}
                  aria-label="Remove preset"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.colors.textMuted,
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <input
                type="file"
                accept="image/*"
                id="create-post-photo"
                style={{ display: 'none' }}
                onChange={onPickPhoto}
              />
              <label
                htmlFor="create-post-photo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Photo
              </label>
              <button
                type="button"
                onClick={() => setPresetPicker(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Attach preset
              </button>
            </div>

            {error && (
              <p style={{ color: theme.colors.error, margin: 0, fontSize: '13px' }}>
                {error}
              </p>
            )}

            <Button
              onClick={() => void handleSubmit()}
              disabled={!canPost || submitting}
            >
              {submitting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
