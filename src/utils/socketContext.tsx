import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  error: Error | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    
    const socket = io(SOCKET_URL, {
      path: '/api/socketio',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Socket connected');
    });

    socket.on('connect_error', (err: Error) => {
      setError(err);
      console.error('Socket connection error:', err);
    });

    socket.on('disconnect', (reason: string) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    socket.on('error', (err: Error) => {
      setError(err);
      console.error('Socket error:', err);
    });

    setSocket(socket);

    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setError(null);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, error }}>
      {children}
    </SocketContext.Provider>
  );
}; 