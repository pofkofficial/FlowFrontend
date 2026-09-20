import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(
  eventName?: string,
  callback?: (data: any) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('/', {
      transports: ['websocket'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    if (eventName && callback) {
      socket.on(eventName, callback);
    }

    return () => {
      if (eventName) {
        socket.off(eventName);
      }
      socket.disconnect();
    };
  }, [eventName, callback]);

  return socketRef.current;
}