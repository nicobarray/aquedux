// @flow

import sockjs from 'sockjs'
import http from 'http'

import getFragmentsRoute from './network/routes/fragments'
import getFragmentRoute from './network/routes/fragment'
import getChannelsRoute from './network/routes/channels'
import getTanksRoute from './network/routes/tanks'

import tankManager from './managers/tankManager'
import channelManager from './managers/channelManager'
import configManager from './managers/configManager'

import type { Store } from './constants/types'
import actionTypes from './constants/actionTypes'
import { initRedisConnection } from './redis/connections'
import * as eventHub from './utils/eventHub'
import logger from './utils/logger'
import mapActionToChannelId from './mapActionToChannelId'
import actionCreators from './actionCreators'

import receive from './network/receive'
import send from './network/send'
import createSocketServer from './network/socketServer'

function onSendActionToTank({ tankId, action }) {
  // TODO: is this necessary ?
  if (actionTypes.tank.hasOwnProperty(action.type)) {
    return
  }

  if (action.meta && action.meta.ignore) {
    return
  }

  send(tankManager.getTank(tankId).socket, action)
}

function onSendChannelSnapshotToTank(getState) {
  return function({ channelName, subAction }) {
    logger.debug({ who: 'server', what: 'send channel snapshot to tank', channelName, subAction })

    const channel = channelManager.getChannelHandlersFromName(channelName)
    const snapshotAction = actionCreators.snapshotChannel(
      subAction.name,
      subAction.id,
      channel.reducer(getState, subAction.id)
    )

    send(tankManager.getTank(subAction.tankId).socket, snapshotAction)
  }
}

function onMessage(dispatch) {
  return function(tankId, action) {
    receive(dispatch, tankId, action)
  }
}

function onConnection(store: Store) {
  const { onConnection: userOnConnection, onClose: userOnClose } = configManager.getConfig()

  return function(socket) {
    logger.trace({ type: 'new connection', id: socket.id })
    // Register the socket as an Aquedux tank (optimistic for now).
    tankManager.addTank(socket.id, socket)

    socket.on('data', message => {
      const json = JSON.parse(message)
      // Check if the message could be an action, if not ignore the message.
      if (json.type) {
        logger.trace({ type: 'new message', id: socket.id, message })
        onMessage(store.dispatch.bind(store))(socket.id, json)
      }
    })

    socket.on('close', () => {
      logger.trace({ type: 'close connection', id: socket.id })

      if (userOnClose) {
        userOnClose(socket)
      }

      // Remove the tank from the tanks object.
      tankManager.removeTank(socket.id)
    })

    if (userOnConnection) {
      userOnConnection(socket)
    }
  }
}

function createServer(store: Store, options: any = {}) {
  const { host, port, routePrefix } = configManager.setConfig(options)

  initRedisConnection()

  let socketServer = sockjs.createServer({
    sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'
  })

  socketServer.on('connection', onConnection(store))

  // This event is for sending data to a single tank.
  eventHub.register(eventHub.EVENT_SEND_ACTION_TO_TANK, onSendActionToTank)

  // This event is for sending channel data to a single tank.
  eventHub.register(
    eventHub.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK,
    onSendChannelSnapshotToTank(store.getState.bind(store))
  )

  return {
    start(httpServer: ?http.Server = null) {
      if (!httpServer) {
        httpServer = http.createServer()
      }

      socketServer.installHandlers(httpServer, { prefix: routePrefix + '/aquedux' })
      httpServer.listen(port, host)

      return httpServer
    },
    setActionToChannelId: mapActionToChannelId.setMapActionToChannelId
  }
}

export default createServer
