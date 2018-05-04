// @flow

import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'

import actionTypes from './constants/actionTypes'
import type { Store } from './constants/types'
import channelManager from './managers/channelManager'
import configManager from './managers/configManager'
import { forwardActionToChannelSubscribers } from './network/channels'
import { subscribeFromAction, unsubscribeFromAction } from './network/subscribe'
import asyncCreate from './redis/asyncCreate'
import asyncPush from './redis/asyncPush'
import * as eventHub from './utils/eventHub'
import logger from './utils/logger'
import { selectors } from './reducers'

const isStatefull = actionType => {
  const { hydratedActionTypes } = configManager.getConfig()
  return hydratedActionTypes.indexOf(actionType) !== -1
}

const respondToSender = action => {
  const args = {
    tankId: action.tankId,
    action
  }

  // Return the reduced action to its sender.
  eventHub.raise(eventHub.EVENT_SEND_ACTION_TO_TANK, args)
}

const statefullActionToRedis = async (store: Store, action: Object) => {
  logger.trace({
    who: 'middleware',
    what: 'action road',
    where: 'statefull, wire to redis',
    step: 2,
    type: action.type
  })

  const ownId = selectors.queue.getId(store.getState())
  const water = {
    ...omit(action, ['token', 'tankId']),
    origin: `${ownId}:${action.tankId}`
  }

  const queueName = channelManager.findChannelNameForAction(store.getState(), action)
  if (!selectors.queue.hasQueue(store.getState(), queueName)) {
    await asyncCreate(store, queueName)
  }
  await asyncPush(store, queueName, water)
}

const statefullActionFromRedis = (store: Store, next: Object => void, action: Object) => {
  const ownId = selectors.queue.getId(store.getState())
  const [backId, tankId] = action.origin.split(':')
  const nextAction = {
    ...omit(action, ['origin']),
    ...omitBy({ tankId }, field => field === 'undefined')
  }
  logger.trace({
    who: 'middleware',
    what: 'action road',
    where: 'statefull, from redis. reduce it.',
    step: 4,
    type: action.type
  })

  // Default behaviour, if the action has reduce, send it to subscribers
  // through channels.
  next(nextAction)

  if (nextAction.meta && nextAction.meta.ignore) {
    return
  }

  // Return the statefull action to its sender.
  if (ownId === backId && nextAction.tankId !== undefined) {
    logger.trace({
      who: 'middleware',
      what: 'action road',
      where: 'reduced. Send it back to sender',
      step: 5,
      type: action.type
    })
    respondToSender(nextAction)
  }

  logger.trace({
    who: 'middleware',
    what: 'action road',
    where: 'forward to channels',
    step: 5,
    type: action.type
  })

  const isPrivate = action.meta && action.meta.private
  if (!isPrivate) {
    forwardActionToChannelSubscribers(store, action)
  } else {
    logger.debug({ who: 'middleware', what: 'Private action, do not send to channel', type: action.type })
  }
}

const statelessAction = (store: Store, next: Object => void, action: Object) => {
  logger.trace({
    who: 'aquedux::middleware',
    what: 'stateless action',
    type: action.type
  })
  next(action)
  logger.trace({
    who: 'middleware',
    what: 'action road',
    where: 'stateless, return to client after reducing',
    step: 2,
    type: action.type,
    tankId: action.tankId
  })
  if (action.tankId !== undefined) {
    respondToSender(action)
  }
}

export default (store: Store) => (next: Object => void) => (action: Object) => {
  logger.trace({
    who: 'middleware',
    action
  })

  let nextAction = action
  if (nextAction.type === actionTypes.client.AQUEDUX_CLIENT_PING && nextAction.meta) {
    nextAction.meta.private = true
  }

  // Handle subscribing actions here.
  if (nextAction.type === actionTypes.client.AQUEDUX_CLIENT_CHANNEL_JOIN) {
    subscribeFromAction(store, nextAction)
  } else if (nextAction.type === actionTypes.client.AQUEDUX_CLIENT_CHANNEL_LEAVE) {
    unsubscribeFromAction(store, nextAction)
    // } else if (action.type === actionTypes.api.AQUEDUX_REMOVE_QUEUE) {
    //   deleteQueueFromAction(store, action)
  } else if (!isStatefull(nextAction.type) || (nextAction.meta && nextAction.meta.private)) {
    // A stateless action, therefore we reduce it and send it back
    // to its sender.
    // Those actions handle user-specific logic: role, ping, etc.
    statelessAction(store, next, nextAction)
  } else if (!nextAction.origin) {
    // A statefull action that was not in Redis, wire it to Redis.
    statefullActionToRedis(store, nextAction)
  } else {
    // A statefull action that comes from Redis, reduce it and dispatch it
    // to sender and channels.
    statefullActionFromRedis(store, next, nextAction)
  }
}
