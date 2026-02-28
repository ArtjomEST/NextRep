'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isTelegramWebApp } from '@/lib/auth/client';
import { fetchMe, linkAccount } from '@/lib/api/client';

export default function TelegramLinkButton() {
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const callbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isTelegramWebApp()) return;

    fetchMe().then((me) => {
      if (me) setIsLinked(me.isLinked);
    });
  }, [mounted]);

  const handleLink = useCallback(async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.MainButton) return;

    tg.MainButton.showProgress(true);
    const ok = await linkAccount();
    tg.MainButton.hideProgress();

    if (ok) {
      setIsLinked(true);
      tg.MainButton.hide();
      tg.showAlert?.('Account linked successfully!');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tg = window.Telegram?.WebApp;
    if (!tg?.MainButton) return;

    if (isLinked === false) {
      tg.MainButton.text = 'Link Account';
      tg.MainButton.show();

      callbackRef.current = handleLink;
      tg.MainButton.onClick(handleLink);

      return () => {
        if (callbackRef.current) {
          tg.MainButton?.offClick(callbackRef.current);
        }
        tg.MainButton?.hide();
      };
    } else {
      tg.MainButton.hide();
    }
  }, [mounted, isLinked, handleLink]);

  return null;
}
