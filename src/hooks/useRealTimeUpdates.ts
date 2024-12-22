import { useEffect, useCallback } from 'react';
import { useSocket } from '../utils/socketContext';

interface UpdateData {
  type: string;
  data: any;
}

export const useRealTimeUpdates = (
  eventName: string,
  onUpdate: (data: any) => void
) => {
  const { socket } = useSocket();

  const emitUpdate = useCallback(
    (data: any) => {
      if (socket) {
        socket.emit(eventName, data);
      }
    },
    [socket, eventName]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, (data: UpdateData) => {
      onUpdate(data);
    });

    return () => {
      socket.off(eventName);
    };
  }, [socket, eventName, onUpdate]);

  return { emitUpdate };
}; 