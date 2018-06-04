// @flow

import type { Store } from '../constants/types'
import actionTypes from '../constants/actionTypes'
import tankManager from '../managers/tankManager'
import channelManager from '../managers/channelManager'
import configManager from '../managers/configManager'
import { initRedisConnection } from '../redis/connections'
import * as eventHub from '../utils/eventHub'
import logger from '../utils/logger'
import mapActionToChannelId from '../mapActionToChannelId'
import receive from './receive'
import send from './send'
import createSocketServer from './socketServer'

const createAqueduxServer = (store: Store, options: any = {}) => {
  const { onConnection, onClose, routePrefix } = configManager.setConfig(options)

  initRedisConnection()

  const handleMessage = (tankId, action) => {
    receive(store.dispatch, tankId, action)
  }

  const socketServer = createSocketServer(store, onConnection, onClose, handleMessage, routePrefix)

  // This event is for sending data to a single tank.
  eventHub.register(eventHub.EVENT_SEND_ACTION_TO_TANK, args => {
    const { tankId, action } = args

    if (actionTypes.tank.hasOwnProperty(action.type)) {
      return
    }

    if (action.meta && action.meta.ignore) {
      logger.debug({
        who: 'server::EVENT_SEND_ACTION_TO_TANK',
        what: 'reduced action for snapshot ignored',
        type: action.type
      })
      return
    }

    send(tankManager.getTank(tankId).socket, action)
  })

  // This event is for sending channel data to a single tank.
  eventHub.register(eventHub.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK, ({ channelName, subAction }) => {
    logger.debug({ who: 'server', what: 'send channel snapshot to tank', channelName, subAction })

    const channel = channelManager.getChannelHandlersFromName(channelName)
    const snapshotAction = actions.channel.snapshot(
      subAction.name,
      subAction.id,
      channel.reducer(store.getState, subAction.id)
    )

    send(tankManager.getTank(subAction.tankId).socket, snapshotAction)
  })

  return {
    start: (host: string, port: number) => socketServer.start(host, port),
    addChannel: addChannel(store.dispatch),
    addChannelTemplate: addChannelTemplate(store.dispatch),
    setActionToChannelId: mapActionToChannelId.setMapActionToChannelId
  }
}

export default createAqueduxServer
