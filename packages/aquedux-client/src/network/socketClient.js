import SockJS from 'sockjs-client'

const createSocketClient = (endpoint, handleOpen, handleClose, handleMessage) => {
  const socket = new SockJS(endpoint)

  socket.onopen = () => {
    handleOpen(socket)
  }

  socket.onclose = () => {
    handleClose(socket)
    socket.close()
  }

  socket.onmessage = e => {
    handleMessage(socket, e)
  }

  return socket
}

export default createSocketClient
