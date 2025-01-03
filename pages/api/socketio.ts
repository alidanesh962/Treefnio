import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up socket');
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://treefnio.vercel.app']
        : 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: {
      name: 'io',
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    }
  });
  
  res.socket.server.io = io;

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send initial connection success event
    socket.emit('connection_success', { message: 'Successfully connected to server' });

    // Join a default room for broadcasting
    socket.join('broadcast-room');

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      socket.leave('broadcast-room');
    });

    // Add your custom event handlers here
    socket.on('tableUpdate', (data) => {
      console.log('Table update received:', data);
      // Broadcast to all clients in the room
      io.to('broadcast-room').emit('tableUpdate', data);
    });

    socket.on('orderUpdate', (data) => {
      console.log('Order update received:', data);
      io.to('broadcast-room').emit('orderUpdate', data);
    });

    // Settings update handler
    socket.on('settingsUpdate', (data: { type: string; data: any }) => {
      console.log(`Settings update received - Type: ${data.type}`, data.data);
      // Broadcast the settings update to all clients in the room
      io.to('broadcast-room').emit('settingsUpdate', data);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket is initialized');
  res.end();
};

export default SocketHandler;

export const config = {
  api: {
    bodyParser: false,
  },
}; 