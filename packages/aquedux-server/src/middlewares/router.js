// @flow

import { type Action } from '../constants/types'

import configManager from '../managers/configManager'
import channelManager from '../managers/channelManager'
import queueManager from '../managers/queueManager'
import tankManager from '../managers/tankManager'

import asyncCreate from '../redis/asyncCreate'
import asyncPush from '../redis/asyncPush'
import { raise, events } from '../utils/eventHub'
import logger from '../utils/logger'
import type { Store } from '../constants/types'

// Routes.
function statelessAction(next: Object => void, action: Object) {
  next(action)
  raise(events.EVENT_SEND_ACTION_TO_TANK, { tankId: action.meta.tankId, action })
}

async function statefullActionToRedis(store: Store, action: Action) {
  const queueName = channelManager.findChannelNameForAction(action)
  if (queueManager.hasNoQueue(queueName)) {
    await asyncCreate(queueName)
  }

  await asyncPush(queueName, { ...action, meta: { ...action.meta, saved: true } })
}

function statefullActionFromRedis(store: Store, next: Object => void, action: Action) {
  // Default behaviour, if the action has reduce, send it to subscribers
  // through channels.
  next(action)

  // Return the statefull action to its sender if it was send by one of this aquedux-server's tanks.
  tankManager
    .listAll()
    .filter(tank => {
      // * Here tank.channels has everything needed to compute a valid predicate
      // * if the channel is a template.

      return tank.channels.some(channelName => {
        return channelManager.getChannelHandlersFromName(channelName).predicate(action)
      })
    })
    .forEach(tank => {
      raise(events.EVENT_SEND_ACTION_TO_TANK, {
        tankId: tank.id,
        action
      })
    })
}

function logRoute(route: string, action: Action): void {
  logger.debug({
    who: 'middleware',
    route: route,
    action
  })
}

export default (store: Store) => (next: Function) => (action: Object) => {
  const { type } = action
  const { hydratedActionTypes, serverId } = configManager.getConfig()

  const isLocal: boolean = !!(!action.meta || (!action.meta.tankId || action.meta.ignore))
  const isStateless: boolean = hydratedActionTypes.indexOf(type) === -1
  const isPrivate: boolean = !!(action.meta && action.meta.private && action.meta.serverId === serverId)
  const isSaved: boolean = !!(action.meta && action.meta.saved)

  if (isLocal) {
    logRoute('local', action)

    // The action comes from:
    // - a queue initialisation
    // - the server
    next(action)
  } else if (isStateless || isPrivate) {
    logRoute('client -> client', action)

    // A user stateless action, therefore we reduce it and send it back
    // to its sender.
    // Those actions handle user-specific logic: role, ping, etc.
    statelessAction(next, action)
  } else if (!isSaved) {
    logRoute('client -> redis', action)
    // A statefull action that was not in Redis, wire it to Redis.
    statefullActionToRedis(store, action)
  } else {
    logRoute('redis -> client', action)
    // A statefull action that comes from Redis, reduce it and dispatch it
    // to sender and channels.
    statefullActionFromRedis(store, next, action)
  }
}
