'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { theme } from '@/lib/theme';
import {
  createPresetApi,
  fetchAiChatHistoryApi,
  postAiChatApi,
  type AiChatMessageRow,
  type AiGeneratedPreset,
} from '@/lib/api/client';
import { isPresetIntentMessage } from '@/lib/ai/presetIntent';

/** Minimal Web Speech API types (not always in TS lib). */
type SpeechRecognitionResultList = ArrayLike<{
  0: { transcript: string };
  isFinal?: boolean;
}>;

interface SpeechRecognitionResultEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const LAST_READ_KEY = 'nextrep-ai-chat-last-read';

function getWelcomeMessage(): AiChatMessageRow {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hey! I'm Alex, your personal AI coach. Ask me anything about your training, recovery, or progress! 💪",
    createdAt: new Date().toISOString(),
  };
}

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

type SaveUiState = 'idle' | 'saving' | 'saved' | 'error';

export default function AIChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingPresetIntent, setPendingPresetIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnread, setShowUnread] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [previewPreset, setPreviewPreset] = useState<AiGeneratedPreset | null>(
    null,
  );
  const [saveUiByMessageId, setSaveUiByMessageId] = useState<
    Record<string, SaveUiState>
  >({});

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const hidden = pathname === '/workout/active';
  const tabBarVisible =
    !pathname.startsWith('/workout') &&
    !pathname.startsWith('/start') &&
    !pathname.startsWith('/account/presets');
  const fabBottom = tabBarVisible ? 90 : 24;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSpeechSupported(!!Ctor);
  }, []);

  const markRead = useCallback(() => {
    if (typeof window === 'undefined') return;
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setShowUnread(false);
  }, []);

  const refreshUnread = useCallback((list: AiChatMessageRow[]) => {
    if (typeof window === 'undefined') return;
    const last = list[list.length - 1];
    if (!last || last.role !== 'assistant') {
      setShowUnread(false);
      return;
    }
    const raw = localStorage.getItem(LAST_READ_KEY);
    const lastRead = raw ? new Date(raw).getTime() : 0;
    const t = new Date(last.createdAt).getTime();
    setShowUnread(t > lastRead);
  }, []);

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setError(null);
      try {
        const list = await fetchAiChatHistoryApi();
        if (cancelled) return;
        if (list.length === 0) {
          const w = getWelcomeMessage();
          setMessages([w]);
          refreshUnread([w]);
        } else {
          setMessages(list);
          refreshUnread(list);
        }
      } catch {
        if (!cancelled) {
          const w = getWelcomeMessage();
          setMessages([w]);
          refreshUnread([w]);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hidden, refreshUnread]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) markRead();
  }, [open, messages, markRead]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages, sending, pendingPresetIntent]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggleMic() {
    if (!speechSupported || typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    if (recording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      setRecording(false);
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = '';

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInput(text.trimStart());
    };

    recognition.onerror = () => {
      setRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function handleSavePreset(messageId: string, preset: AiGeneratedPreset) {
    const exerciseIds = preset.exercises
      .map((e) => e.exerciseId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (exerciseIds.length === 0) {
      setSaveUiByMessageId((s) => ({ ...s, [messageId]: 'error' }));
      return;
    }
    setSaveUiByMessageId((s) => ({ ...s, [messageId]: 'saving' }));
    try {
      await createPresetApi({ name: preset.name, exerciseIds });
      setSaveUiByMessageId((s) => ({ ...s, [messageId]: 'saved' }));
    } catch {
      setSaveUiByMessageId((s) => ({ ...s, [messageId]: 'error' }));
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setPendingPresetIntent(isPresetIntentMessage(text));
    setError(null);
    const optimisticUser: AiChatMessageRow = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimisticUser]);
    try {
      const { reply, preset } = await postAiChatApi(text);
      const assistant: AiChatMessageRow = {
        id: `local-a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
        ...(preset ? { preset } : {}),
      };
      setMessages((m) => {
        const withoutLast =
          m.length > 0 && m[m.length - 1]?.id === optimisticUser.id
            ? m.slice(0, -1)
            : m;
        return [...withoutLast, optimisticUser, assistant];
      });
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== optimisticUser.id));
      setInput(text);
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
      setPendingPresetIntent(false);
    }
  }

  function handleClose() {
    setOpen(false);
    markRead();
  }

  if (hidden) return null;

  return (
    <>
      <AiChatKeyframes />
      <button
        type="button"
        aria-label="Open AI coach chat"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          zIndex: 200,
          right: 16,
          bottom: `calc(${fabBottom}px + env(safe-area-inset-bottom, 0px))`,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
        {showUnread && !open && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              border: '2px solid #15803d',
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            role="presentation"
            onClick={handleClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              height: '85vh',
              maxHeight: '85dvh',
              backgroundColor: theme.colors.card,
              borderTop: `1px solid ${theme.colors.border}`,
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px 12px',
                borderBottom: `1px solid ${theme.colors.border}`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      color: theme.colors.textPrimary,
                      fontWeight: 700,
                      fontSize: 17,
                    }}
                  >
                    🤖 Alex · AI Coach
                  </div>
                  <div
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    Your personal trainer
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.colors.textSecondary,
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {loadingHistory && messages.length === 0 && (
                <div
                  style={{
                    color: theme.colors.textMuted,
                    fontSize: 14,
                    textAlign: 'center',
                    marginTop: 24,
                  }}
                >
                  Loading…
                </div>
              )}
              {error && !sending && (
                <div
                  style={{
                    color: theme.colors.error,
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 14,
                        border: isUser
                          ? '1px solid rgba(34,197,94,0.35)'
                          : '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: isUser
                          ? 'rgba(34,197,94,0.15)'
                          : '#151b21',
                        color: theme.colors.textPrimary,
                        fontSize: 14,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.content}
                    </div>
                    {m.role === 'assistant' && m.preset && (
                      <AiPresetResultCard
                        preset={m.preset}
                        saveState={saveUiByMessageId[m.id] ?? 'idle'}
                        onPreview={() => setPreviewPreset(m.preset!)}
                        onSave={() => void handleSavePreset(m.id, m.preset!)}
                      />
                    )}
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.colors.textMuted,
                        marginTop: 4,
                        textAlign: isUser ? 'right' : 'left',
                        paddingLeft: isUser ? 0 : 4,
                        paddingRight: isUser ? 4 : 0,
                      }}
                    >
                      {formatMessageTime(m.createdAt)}
                    </div>
                  </div>
                );
              })}
              {sending && pendingPresetIntent && <PresetLoadingCard />}
              {sending && !pendingPresetIntent && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '12px 16px',
                    borderRadius: 14,
                    backgroundColor: '#151b21',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                  }}
                >
                  <TypingDot delay={0} />
                  <TypingDot delay={0.15} />
                  <TypingDot delay={0.3} />
                </div>
              )}
            </div>

            <div
              style={{
                padding:
                  '10px 16px max(12px, env(safe-area-inset-bottom, 12px))',
                borderTop: `1px solid ${theme.colors.border}`,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                flexShrink: 0,
                backgroundColor: theme.colors.surface,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask your coach…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSend();
                }}
                disabled={sending}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgPrimary,
                  color: theme.colors.textPrimary,
                  fontSize: 15,
                  padding: '12px 14px',
                  outline: 'none',
                }}
              />
              {speechSupported && (
                <button
                  type="button"
                  aria-label={recording ? 'Stop voice input' : 'Start voice input'}
                  aria-pressed={recording}
                  onClick={() => toggleMic()}
                  disabled={sending}
                  className={recording ? 'nr-ai-mic-rec' : 'nr-ai-mic-idle'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: sending ? 'default' : 'pointer',
                    opacity: sending ? 0.45 : 1,
                    padding: 0,
                    position: 'relative',
                    ...(recording
                      ? {
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.4)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }),
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={recording ? '#f87171' : theme.colors.textSecondary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                aria-label="Send"
                disabled={sending || !input.trim()}
                onClick={() => void handleSend()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  cursor: sending || !input.trim() ? 'default' : 'pointer',
                  opacity: sending || !input.trim() ? 0.45 : 1,
                  background:
                    'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                →
              </button>
            </div>
          </div>

          {previewPreset && (
            <AiPresetPreviewSheet
              preset={previewPreset}
              onClose={() => setPreviewPreset(null)}
            />
          )}
        </div>
      )}
    </>
  );
}

function AiPresetResultCard({
  preset,
  saveState,
  onPreview,
  onSave,
}: {
  preset: AiGeneratedPreset;
  saveState: SaveUiState;
  onPreview: () => void;
  onSave: () => void;
}) {
  const busy = saveState === 'saving';
  const saved = saveState === 'saved';
  const failed = saveState === 'error';

  return (
    <div
      style={{
        marginTop: 10,
        padding: '12px 14px',
        borderRadius: 14,
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: theme.colors.textPrimary,
          marginBottom: 4,
        }}
      >
        💪 {preset.name}
      </div>
      <div
        style={{
          fontSize: 12,
          color: theme.colors.textMuted,
          marginBottom: 10,
        }}
      >
        Generated by Alex
      </div>
      <ul
        style={{
          margin: '0 0 12px',
          paddingLeft: 16,
          color: theme.colors.textSecondary,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {preset.exercises.map((ex, i) => (
          <li key={`${ex.name}-${i}`} style={{ marginBottom: 6 }}>
            <span style={{ color: theme.colors.textPrimary }}>• {ex.name}</span>
            <span style={{ color: theme.colors.textMuted, marginLeft: 8 }}>
              {ex.sets}×{ex.reps}
              {ex.restSeconds > 0 ? `  ${ex.restSeconds}s` : ''}
            </span>
          </li>
        ))}
      </ul>
      {preset.coachNote ? (
        <div
          style={{
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginBottom: 12,
            padding: '8px 10px',
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          💬 &quot;{preset.coachNote}&quot;
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onPreview}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.card,
            color: theme.colors.textPrimary,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          👁 Preview
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy || saved}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${theme.colors.primary}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.primary,
            fontWeight: 700,
            fontSize: 13,
            cursor: busy || saved ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {saved
            ? 'Saved! ✓'
            : busy
              ? 'Saving…'
              : '💾 Save Preset'}
        </button>
      </div>
      {failed && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: theme.colors.error,
            fontWeight: 600,
          }}
        >
          Save failed, try again
        </div>
      )}
    </div>
  );
}

function PresetLoadingCard() {
  const rows = [
    { label: 'Selecting exercises', delay: 0 },
    { label: 'Calculating sets', delay: 0.15 },
    { label: 'Optimizing rest times', delay: 0.3 },
  ];
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        padding: '14px 16px',
        borderRadius: 14,
        backgroundColor: '#151b21',
        border: '1px solid rgba(255,255,255,0.06)',
        maxWidth: '92%',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: theme.colors.textPrimary,
          marginBottom: 14,
        }}
      >
        🤖 Building your workout...
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{ marginBottom: 10 }}
        >
          <div
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 4,
                background:
                  'linear-gradient(90deg, rgba(34,197,94,0.85), rgba(21,128,61,0.95))',
                animation: 'nr-ai-preset-bar 1.35s ease-in-out infinite',
                animationDelay: `${row.delay}s`,
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
            {row.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function AiPresetPreviewSheet({
  preset,
  onClose,
}: {
  preset: AiGeneratedPreset;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxHeight: '78vh',
          overflowY: 'auto',
          backgroundColor: theme.colors.card,
          borderTop: `1px solid ${theme.colors.border}`,
          borderRadius: '16px 16px 0 0',
          padding:
            '16px 16px max(20px, env(safe-area-inset-bottom, 20px))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: theme.colors.textPrimary,
            }}
          >
            💪 {preset.name}
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.textSecondary,
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 13,
            color: theme.colors.textMuted,
          }}
        >
          Read-only preview · Generated by Alex
        </p>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            color: theme.colors.textSecondary,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          {preset.exercises.map((ex, i) => (
            <li key={`pv-${i}`} style={{ marginBottom: 8 }}>
              <strong style={{ color: theme.colors.textPrimary }}>
                {ex.name}
              </strong>
              {' — '}
              {ex.sets}×{ex.reps}
              {ex.restSeconds > 0 ? ` · ${ex.restSeconds}s rest` : ''}
            </li>
          ))}
        </ol>
        {preset.coachNote ? (
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 13,
              color: theme.colors.textSecondary,
              lineHeight: 1.45,
            }}
          >
            💬 {preset.coachNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        backgroundColor: theme.colors.textMuted,
        animation: 'nr-ai-dot 1s ease-in-out infinite',
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function AiChatKeyframes() {
  useEffect(() => {
    const id = 'nr-ai-chat-keyframes';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes nr-ai-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
      @keyframes nr-ai-preset-bar{
        0%,100%{width:28%}
        50%{width:88%}
      }
      @keyframes nr-ai-mic-ring{
        0%{transform:scale(1);opacity:.55}
        100%{transform:scale(1.45);opacity:0}
      }
      .nr-ai-mic-rec::before{
        content:'';
        position:absolute;
        inset:-4px;
        border-radius:50%;
        border:2px solid rgba(239,68,68,0.45);
        animation:nr-ai-mic-ring 1.2s ease-out infinite;
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}
