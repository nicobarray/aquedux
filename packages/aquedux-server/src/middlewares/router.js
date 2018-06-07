// @flow

import omit from 'lodash/omit'

import configManager from '../managers/configManager'
import channelManager from '../managers/channelManager'
import queueManager from '../managers/queueManager'
import tankManager from '../managers/tankManager'

import asyncCreate from '../redis/asyncCreate'
import asyncPush from '../redis/asyncPush'
import * as eventHub from '../utils/eventHub'
import type { Store } from '../constants/types'

// Helpers.
function respondToSender(action) {
  const args = {
    tankId: action.tankId,
    action
  }

  // Return the reduced action to its sender.
  eventHub.raise(eventHub.EVENT_SEND_ACTION_TO_TANK, args)
}

// Routes.
function statelessAction(next: Object => void, action: Object) {
  next(action)
  respondToSender(action)
}

async function statefullActionToRedis(store: Store, action: Object) {
  const { serverId } = configManager.getConfig()

  const water = {
    ...omit(action, ['token', 'tankId']),
    meta: {
      ...action.meta,
      serverId,
      tankId: action.tankId
    }
  }

  const queueName = channelManager.findChannelNameForAction(action)
  if (queueManager.hasNoQueue(queueName)) {
    await asyncCreate(queueName)
  }

  await asyncPush(queueName, water)
}

function statefullActionFromRedis(store: Store, next: Object => void, action: Object) {
  const { serverId } = configManager.getConfig()

  const water = {
    ...action,
    tankId: action.meta.tankId,
    meta: omit(action.meta, ['tankId', 'serverId'])
  }

  // Default behaviour, if the action has reduce, send it to subscribers
  // through channels.
  next(water)

  // TODO: Check if this is a "hack"
  const isIgnored = water.meta && water.meta.ignore
  if (isIgnored) {
    return
  }

  // Return the statefull action to its sender if it was send by one of this aquedux-server's tanks.
  const isPrivate = water.meta && water.meta.private
  const fromUs = action.meta.serverId === serverId
  if (isPrivate && fromUs) {
    respondToSender(water)
    return
  }

  tankManager
    .listAll()
    .filter(tank => {
      // * Here tank.channels has everything needed to compute a valid predicate
      // * if the channel is a template.

      return tank.channels.some(channelName => {
        return channelManager.getChannelHandlersFromName(channelName).predicate(water)
      })
    })
    .forEach(tank => {
      eventHub.raise(eventHub.EVENT_SEND_ACTION_TO_TANK, {
        tankId: tank.id,
        water
      })
    })
}

export default (store: Store) => (next: Function) => (action: Object) => {
  const { type, tankId } = action
  const { hydratedActionTypes } = configManager.getConfig()
  const isStateless = !hydratedActionTypes.find(t => t === type)
  const isPrivate = action.meta && action.meta.private
  const isFresh = !action.origin

  if (!tankId) {
    // Local action, skip the router.
    next(action)
    return
  }

  if (isStateless || isPrivate) {
    // A user stateless action, therefore we reduce it and send it back
    // to its sender.
    // Those actions handle user-specific logic: role, ping, etc.
    statelessAction(next, action)
  } else if (isFresh) {
    // A statefull action that was not in Redis, wire it to Redis.
    statefullActionToRedis(store, action)
  } else {
    // A statefull action that comes from Redis, reduce it and dispatch it
    // to sender and channels.
    statefullActionFromRedis(store, next, action)
  }
}
