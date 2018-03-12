// @flow

// Types.
import type { Store } from '../constants/types'

type AqueduxConfiguration = {
  // The action count after which the redis queue must compact itself to 1 action.
  queueLimit: number,
  // The action types that should be routed to redis.
  statefullTypes: Array<string>,
  routePrefix: string,
  onConnection: any => void,
  onClose: any => void
}

// Helpers.
import * as fromConstants from '../utils/constants'
import * as eventHub from '../utils/eventHub'
import logger from '../utils/logger'
import actions from '../actions'
import actionTypes from '../constants/actionTypes'
import { selectors } from '../reducers'

// Managers.
import tankManager from '../managers/tankManager'
import channelManager from '../managers/channelManager'

// Aquedux API.
import { addChannel, addChannelTemplate } from './channels'
import setStatefullTypes from './statefullTypes'
import mapActionToChannelId from '../mapActionToChannelId'

// Logic.
import createSocketServer from './socketServer'
import receive from './receive'
import send from './send'

let ownId = () => undefined
export const getOwnId = () => {
  return ownId()
}

const createAqueduxServer = (
  store: Store,
  options: AqueduxConfiguration = {
    queueLimit: 0,
    statefullTypes: [],
    routePrefix: '/undefined',
    onConnection: socket => {},
    onClose: socket => {}
  }
) => {
  // Bind ownId to store.
  ownId = () => selectors.queue.getId(store.getState())

  // Apply options.
  store.dispatch(actions.queue.setOptions(options))

  const handleMessage = (tankId, action) => {
    receive(store.dispatch, tankId, action)
  }

  const socketServer = createSocketServer(
    store,
    options.onConnection,
    options.onClose,
    handleMessage,
    options.routePrefix
  )

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
      subAction.type.substr(4),
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
