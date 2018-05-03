// @flow

// Types.
import type { Store } from '../constants/types'

// Helpers.
import * as fromConstants from '../utils/constants'
import * as eventHub from '../utils/eventHub'
import logger from '../utils/logger'
import actions from '../actions'
import actionTypes from '../constants/actionTypes'
import { selectors } from '../reducers'
import { initRedisConnection } from '../redis/connections'

// Managers.
import tankManager from '../managers/tankManager'
import channelManager from '../managers/channelManager'
import configManager from '../managers/configManager'

// Aquedux API.
import { addChannel, addChannelTemplate } from './channels'
import mapActionToChannelId from '../mapActionToChannelId'

// Logic.
import createSocketServer from './socketServer'
import receive from './receive'
import send from './send'

let ownId = () => undefined
export const getOwnId = () => {
  return ownId()
}

const createAqueduxServer = (store: Store, options: any = {}) => {
  const { onConnection, onClose, routePrefix } = configManager.setConfig(options)

  initRedisConnection()

  // Bind ownId to store.
  ownId = () => selectors.queue.getId(store.getState())

  const handleMessage = (tankId, action) => {
    receive(store.dispatch, tankId, action)
  }

  const socketServer = createSocketServer(store, onConnection, onClose, handleMessage, routePrefix)

  // This event is for sending data to a single tank.
  eventHub.register(fromConstants.EVENT_SEND_ACTION_TO_TANK, args => {
    const { tankId, action } = args

    if (actionTypes.tank.hasOwnProperty(action.type)) {
      logger.trace({
        who: 'server::EVENT_SEND_ACTION_TO_TANK',
        what: 'internal tank action ignored',
        type: action.type
      })

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

    const tank = { conn: tankManager.getSocket(tankId) }

    logger.trace({
      who: 'server',
      what: 'action road',
      where: 'send back to client',
      step: 7,
      type: action.type
    })

    send(tank, action)
  })

  // This event is for sending channel data to a single tank.
  eventHub.register(fromConstants.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK, ({ channelName, subAction }) => {
    logger.debug({ who: 'server', what: 'send channel snapshot to tank', channelName, subAction })
    const tank = { conn: tankManager.getSocket(subAction.tankId) }
    const channel = channelManager.getChannelHandlersFromName(channelName)
    const snapshotAction = actions.channel.snapshot(
      subAction.name,
      subAction.id,
      channel.reducer(store.getState, subAction.id)
    )
    send(tank, snapshotAction)
  })

  return {
    start: (host: string, port: number) => socketServer.start(host, port),
    addChannel: addChannel(store.dispatch),
    addChannelTemplate: addChannelTemplate(store.dispatch),
    setActionToChannelId: mapActionToChannelId.setMapActionToChannelId
  }
}

export default createAqueduxServer
