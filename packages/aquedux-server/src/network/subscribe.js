// @flow

// Types.
import type { Store, Action, SubscriptionAction } from '../constants/types'

// Helpers.
import logger from '../utils/logger'
import * as fromConstants from '../utils/constants'
import * as eventHub from '../utils/eventHub'
import actions from '../actions'
import { selectors } from '../reducers'
import until from '../redis/until'

// Managers.
import channelManager from '../managers/channelManager'

// Logic.
import asyncCreate from '../redis/asyncCreate'

export const subActionToChannelName = (subAction: SubscriptionAction): string => {
  const channelPrefix = subAction.type.substr(4)
  if (subAction.id) {
    return channelPrefix + '-' + subAction.id
  }
  return channelPrefix
}

export const subActionToTemplateName = (subAction: SubscriptionAction): string => {
  if (!subAction.id) {
    throw new Error(`This subscription's target does not match any template. Did you forgot the subscription id?`)
  }
  return subAction.type.substr(4)
}

export const subscribeFromAction = async (store: Store, subAction: SubscriptionAction) => {
  const channelName = subActionToChannelName(subAction)

  logger.trace({
    who: 'subscribe',
    what: 'action road',
    where: 'subscribing to channel',
    step: 3,
    channelName
  })

  subscribe(store, subAction, channelName)

  await fetchQueuesAndRespond(store, channelName)

  logger.debug({ who: 'aquedux-server', what: 'send SNAPSHOT', channelName })

  // TODO: This should be an action dispatch and the result handled in a middleware.
  eventHub.raise(fromConstants.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK, {
    channelName,
    subAction
  })
}

export const unsubscribeFromAction = (store: Store, subAction: Action) => {
  const tankId = subAction.tankId
  if (!tankId) {
    throw new Error('Action ${action.type} does not have a tank ID.')
  }

  const channelPrefix = subAction.type.substring(6)
  const id = subAction.id
  const channelName = !id ? channelPrefix : `${channelPrefix}-${id}`

  unsubscribe(store, tankId, channelName)
}

export const unsubscribeFromChannelName = (store: Store, action: Action, channelPrefix: string, id: ?string) => {
  const tankId = action.tankId
  if (!tankId) {
    throw new Error('Action ${action.type} does not have a tank ID.')
  }
  const channelName = !id ? channelPrefix : `${channelPrefix}-${id}`
  unsubscribe(store, tankId, channelName)
}

export const subscribeToPrivateChannel = async (store: Store, channelName: string): Promise<void> => {
  if (!channelManager.checkChannelExists(channelName)) {
    throw new Error(`${channelName} do not match any channel. Did you call addChannelHandlers?`)
  }

  await fetchQueuesAndRespond(store, channelName)

  logger.debug({ who: 'aquedux-server', what: 'subscribed to a private channel', channelName })
}

// "Private" methods
const fetchQueuesAndRespond = async (store: Store, queueName: string): Promise<void> => {
  logger.debug({
    who: 'aquedux-server',
    what: 'fetch queues',
    queueName
  })

  if (selectors.queue.hasQueue(store.getState(), queueName)) {
    logger.trace({
      who: 'subscribe',
      what: 'action road',
      where: 'get queue localy and respond',
      step: 4,
      queueName
    })

    await until(() => selectors.queue.isReady(store.getState(), queueName))
  } else {
    logger.trace({
      who: 'subscribe',
      what: 'action road',
      where: 'fetch or create queue(s) and respond',
      step: 4,
      queueName
    })

    // ... there used to be a call to asyncFetch (to subscribe to many queues at once)
    await asyncCreate(store, queueName)
  }
}

const subscribe = (store: Store, subAction: SubscriptionAction, channelName: string): void => {
  if (subAction.id) {
    channelManager.createChannelFromTemplate(store, subAction)
  }

  if (!channelManager.checkChannelExists(channelName)) {
    throw new Error(`${channelName} do not match any channel. Did you call addChannelHandlers?`)
  }

  store.dispatch(actions.tank.subscribe(subAction.tankId, channelName))
}

const unsubscribe = (store: Store, tankId: string, channelName: string) => {
  // TODO: This action could remove unused channel definitions in the redux store.
  store.dispatch(actions.tank.unsubscribe(tankId, channelName))
  // TODO: Here unload queues that no one listen to.
  // e.g await asyncUnload(store, queueName)
}
