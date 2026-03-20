'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { theme } from '@/lib/theme';
import {
  fetchAiChatHistoryApi,
  postAiChatApi,
  type AiChatMessageRow,
} from '@/lib/api/client';

const LAST_READ_KEY = 'nextrep-ai-chat-last-read';

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

export default function AIChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnread, setShowUnread] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden = pathname === '/workout/active';
  const tabBarVisible =
    !pathname.startsWith('/workout') &&
    !pathname.startsWith('/start') &&
    !pathname.startsWith('/account/presets');
  const fabBottom = tabBarVisible ? 90 : 24;

  const markRead = useCallback(() => {
    if (typeof window === 'undefined') return;
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setShowUnread(false);
  }, []);

  const refreshUnread = useCallback(
    (list: AiChatMessageRow[]) => {
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
    },
    [],
  );

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setError(null);
      try {
        const list = await fetchAiChatHistoryApi();
        if (cancelled) return;
        setMessages(list);
        refreshUnread(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load chat');
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
  }, [open, messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setError(null);
    const optimisticUser: AiChatMessageRow = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimisticUser]);
    try {
      const { reply } = await postAiChatApi(text);
      const assistant: AiChatMessageRow = {
        id: `local-a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
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
              {sending && (
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
        </div>
      )}
    </>
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
    s.textContent =
      '@keyframes nr-ai-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}';
    document.head.appendChild(s);
  }, []);
  return null;
}
