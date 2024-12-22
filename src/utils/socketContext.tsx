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
    // In production, use the Vercel URL, in development use localhost
    const SOCKET_URL = process.env.NODE_ENV === 'production' 
      ? 'https://treefnio.vercel.app'
      : 'http://localhost:3000';
    
    console.log('Attempting to connect to:', SOCKET_URL);
    
    // Configure Socket.IO client
    const socketInstance = io(SOCKET_URL, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Production settings
      secure: process.env.NODE_ENV === 'production',
      rejectUnauthorized: false,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Socket connected successfully to:', SOCKET_URL);
      console.log('Socket ID:', socketInstance.id);
    });

    socketInstance.on('connection_success', (data: { message: string }) => {
      console.log('Server confirmed connection:', data.message);
    });

    socketInstance.on('connect_error', (err: Error) => {
      setError(err);
      console.error('Socket connection error:', err.message);
      console.log('Failed to connect to:', SOCKET_URL);
      
      // Attempt to reconnect with polling if WebSocket fails
      if (socketInstance.io?.opts?.transports?.includes('websocket')) {
        console.log('Retrying with polling transport...');
        socketInstance.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socketInstance.on('disconnect', (reason: string) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Reconnect if server disconnected
        socketInstance.connect();
      }
    });

    socketInstance.on('error', (err: Error) => {
      setError(err);
      console.error('Socket error:', err);
    });
    // Debug events
    socketInstance.on('reconnect_attempt', (attempt: number) => {
      console.log('Reconnection attempt:', attempt);
    });

    socketInstance.on('reconnect', (attempt: number) => {
      console.log('Reconnected after', attempt, 'attempts');
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
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