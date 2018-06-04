// @flow

import http from 'http'
import sockjs from 'sockjs'
import path from 'path'

import logger from '../utils/logger'

import tankManager from '../managers/tankManager'

const createSocketServer = (store, handleConnection, handleClose, handleMessage, route) => {
  // Create the socket server that is passed to httpServer.
  let socketServer = sockjs.createServer({
    sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'
  })

  // Create the socket list that stores handshaked clients.
  // Its form is as follow:

  // Hook all usuall sockjs callbacks to our handlers.
  socketServer.on('connection', socket => {
    logger.trace({ type: 'new connection', id: socket.id })
    // Register the socket as an Aquedux tank (optimistic for now).
    tankManager.addTank(socket.id, socket)

    handleConnection(socket)

    socket.on('data', message => {
      const json = JSON.parse(message)
      // Check if the message could be an action, if not ignore the message.
      if (json.type) {
        logger.trace({ type: 'new message', id: socket.id, message })
        handleMessage(socket.id, json)
      }
    })

    socket.on('close', () => {
      logger.trace({ type: 'close connection', id: socket.id })
      handleClose(socket)
      // Remove the tank from the tanks object.
      tankManager.removeTank(socket.id)
    })
  })

  var httpServer = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === path.join(route, 'fragments')) {
      getFragmentsRoute(store)(req, res)
    } else if (req.method === 'GET' && req.url.indexOf(path.join(route, 'fragments')) === 0) {
      getFragmentRoute(store, route)(req, res)
    } else if (req.method === 'GET' && req.url === path.join(route, 'channels')) {
      getChannelsRoute(store)(req, res)
    } else if (req.method === 'GET' && req.url === path.join(route, 'tanks')) {
      getTanksRoute(store)(req, res)
    } else {
      res.writeHead(404)
    }
  })

  return {
    start: (host, port) => {
      socketServer.installHandlers(httpServer, { prefix: route + '/aquedux' })
      httpServer.listen(port, host)
      return httpServer
    }
  }
}

export default createSocketServer
