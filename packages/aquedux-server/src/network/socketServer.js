import http from 'http'
import sockjs from 'sockjs'
import path from 'path'

import logger from '../utils/logger'

import actions from '../actions'
import tankManager from '../managers/tankManager'

import getFragmentsRoute from './routes/fragments'
import getFragmentRoute from './routes/fragment'
import getChannelsRoute from './routes/channels'
import getTanksRoute from './routes/tanks'

const createSocketServer = (store, handleConnection, handleClose, handleMessage, route) => {
  // Create the socket server that is passed to httpServer.
  let socketServer = sockjs.createServer({
    sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'
  })

  // Create the socket list that stores handshaked clients.
  // Its form is as follow:

  // Hook all usuall sockjs callbacks to our handlers.
  socketServer.on('connection', conn => {
    // Register the socket as a Aquedux tank (optimistic for now).
    store.dispatch(actions.tank.connect(conn.id))
    tankManager.addSocket(conn.id, conn)

    logger.trace({
      who: 'aquedux::connection',
      what: conn.id
    })

    handleConnection(conn)

    conn.on('data', message => {
      const json = JSON.parse(message)
      // Check if the message could be an action, if not ignore the message.
      if (json.type) {
        logger.trace({
          who: 'socket server',
          what: 'action road',
          where: 'received by SockJS',
          step: 0,
          type: json.type
        })
        handleMessage(conn.id, json)
      }
    })

    conn.on('close', () => {
      handleClose(conn)
      // Remove the tank from the tanks object.
      store.dispatch(actions.tank.disconnect(conn.id))
      tankManager.removeSocket(conn.id)
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
