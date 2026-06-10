'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? '' : 'http://backend:5000');
    globalSocket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return globalSocket;
}

export function useRealtime(event?: string, handler?: (data: any) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    if (event && handlerRef.current) {
      socket.on(event, handlerRef.current);
    }

    return () => {
      if (event && handlerRef.current) {
        socket.off(event, handlerRef.current);
      }
    };
  }, [event]);

  const subscribeJob = useCallback((jobNumber: string) => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('subscribe:job', jobNumber);
  }, []);

  const unsubscribeJob = useCallback((jobNumber: string) => {
    const socket = getSocket();
    socket.emit('unsubscribe:job', jobNumber);
  }, []);

  return { subscribeJob, unsubscribeJob };
}

export function useRealtimeEvent<T = any>(event: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const wrapper = (data: T) => handlerRef.current(data);
    socket.on(event, wrapper);

    return () => {
      socket.off(event, wrapper);
    };
  }, [event]);
}
