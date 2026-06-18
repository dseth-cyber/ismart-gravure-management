'use client';

import { useState, useEffect, useRef } from 'react';

export function useDebouncedCheck(
  value: string,
  checkFn: (val: string) => Promise<boolean>,
  delay = 400
) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'exists' | 'ok'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value || value.trim().length < 2) {
      setStatus('idle');
      return;
    }

    setStatus('checking');
    timerRef.current = setTimeout(async () => {
      try {
        const exists = await checkFn(value.trim());
        if (mountedRef.current) setStatus(exists ? 'exists' : 'ok');
      } catch {
        if (mountedRef.current) setStatus('idle');
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, checkFn, delay]);

  return status;
}
