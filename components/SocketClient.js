import { io } from 'socket.io-client'

const socket = io({
  path: '/api/socket',
})

// Use the socket connection
socket.on('connect', () => {
  console.log('Connected to Socket.IO server')
})