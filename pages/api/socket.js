import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
    res.end()
    return
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  })
  
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('Client connected')
    
    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })
    
    // Add your socket event handlers here
  })

  console.log('Socket is initialized')
  res.end()
}

export default SocketHandler

export const config = {
  api: {
    bodyParser: false,
  },
} 