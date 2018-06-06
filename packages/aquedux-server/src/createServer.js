// @flow

import sockjs from 'sockjs'
import http from 'http'
import omit from 'lodash/omit'
import jwt from 'jsonwebtoken'

import tankManager from './managers/tankManager'
import channelManager from './managers/channelManager'
import configManager from './managers/configManager'

import actionTypes from './constants/actionTypes'
import { initRedisConnection } from './redis/connections'
import { events, register, unregister, raise } from './utils/eventHub'
import logger from './utils/logger'
import { snapshotChannel } from './actionCreators'

function onSendActionToTank({ tankId, action }) {
  // TODO: is this necessary ?
  if (actionTypes.tank.hasOwnProperty(action.type)) {
    return
  }

  if (action.meta && action.meta.ignore) {
    return
  }

  handleSend(tankManager.getTank(tankId).socket, action)
}

function onSendChannelSnapshotToTank({ channelName, subAction, state }) {
  logger.debug({ who: 'server', what: 'send channel snapshot to tank', channelName, subAction })

  const channel = channelManager.getChannelHandlersFromName(channelName)
  const snapshotAction = snapshotChannel(subAction.name, subAction.id, channel.reducer(state, subAction.id))

  handleSend(tankManager.getTank(subAction.tankId).socket, snapshotAction)
}

function handleSend(socket: any, action: Object) {
  const { secret } = configManager.getConfig()
  // The water is an action ready to be sent on the socket.

  const meta = action.meta ? omit(action.meta, ['private']) : {}

  const water = {
    ...omit(action, ['meta', 'tankId', 'origin']),
    token: jwt.sign(meta, secret)
  }

  socket.write(JSON.stringify(water))
}

function handleData(socket: any) {
  return function(message: string) {
    const action = JSON.parse(message)

    // Check if the message could be an action, if not ignore the message.
    if (!action.type) {
      return
    }

    const { secret } = configManager.getConfig()
    let meta = {}

    if (action.token) {
      try {
        meta = jwt.verify(action.token, secret)
      } catch (err) {
        logger.error({ what: 'jwt', who: 'new message', err })
      }
    }

    const water = {
      ...omit(action, ['token']),
      tankId: socket.id,
      meta
    }

    logger.trace({ type: 'new message', id: socket.id, message })

    raise(events.EVENT_ACTION_DISPATCH, water)
  }
}

function handleClose(socket: any) {
  const { onClose } = configManager.getConfig()

  return function() {
    logger.trace({ type: 'close connection', id: socket.id })

    if (onClose) {
      onClose(socket)
    }

    // Remove the tank from the tanks object.
    tankManager.removeTank(socket.id)
  }
}

function handleConnection() {
  const { onConnection } = configManager.getConfig()

  return function(socket) {
    logger.trace({ type: 'new connection', id: socket.id })
    // Register the socket as an Aquedux tank (optimistic for now).
    tankManager.addTank(socket.id, socket)

    socket.on('data', handleData(socket))
    socket.on('close', handleClose(socket))

    if (onConnection) {
      onConnection(socket)
    }
  }
}

function createServer(options: any = {}) {
  const { host, port, routePrefix } = configManager.setConfig(options)

  initRedisConnection()

  const socketServer = sockjs.createServer()

  socketServer.on('connection', handleConnection)

  // This event is for sending data to a single tank.
  register(events.EVENT_SEND_ACTION_TO_TANK, onSendActionToTank)
  // This event is for sending channel data to a single tank.
  register(events.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK, onSendChannelSnapshotToTank)

  return {
    start(httpServer: ?http.Server = null) {
      if (!httpServer) {
        httpServer = http.createServer()
      }

      socketServer.installHandlers(httpServer, { prefix: routePrefix + '/aquedux' })

      httpServer.listen(port, host)

      register(events.EVENT_SERVER_CLOSE, () => {
        // TODO: clear channel subs.
        // TODO: unload queues.

        tankManager
          .listAll()
          .map(tank => tank.socket)
          .forEach(handleClose)

        unregister(events.EVENT_SEND_ACTION_TO_TANK, onSendActionToTank)
        unregister(events.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK, onSendChannelSnapshotToTank)
      })
    }
  }
}

export default createServer
