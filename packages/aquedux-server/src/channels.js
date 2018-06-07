// @flow

import type { SubscriptionAction } from './constants/types'

import channelManager from './managers/channelManager'
import queueManager from './managers/queueManager'
import tankManager from './managers/tankManager'

import asyncCreate from './redis/asyncCreate'
import closeQueue from './redis/closeQueue'

import { raise, events } from './utils/eventHub'
import logger from './utils/logger'
import until from './utils/until'

// Api

export const subActionToTemplateName = (subAction: SubscriptionAction): string => {
  if (!subAction.id) {
    throw new Error(`This subscription's target does not match any template. Did you forgot the subscription id?`)
  }

  return subAction.name
}

// export const unsubscribeFromChannelName = (store: Store, action: Action, channelPrefix: string, id: ?string) => {
//   const tankId = action.tankId
//   if (!tankId) {
//     throw new Error('Action ${action.type} does not have a tank ID.')
//   }
//   const channelName = !id ? channelPrefix : `${channelPrefix}-${id}`
//   unsubscribe(tankId, channelName)
// }

// export const subscribeToPrivateChannel = async (store: Store, channelName: string): Promise<void> => {
//   if (!channelManager.hasChannel(channelName)) {
//     throw new Error(`${channelName} do not match any channel. Did you call addChannelHandlers?`)
//   }

//   await fetchChannelQueues(channelName)

//   logger.debug({ who: 'aquedux-server', what: 'subscribed to a private channel', channelName })
// }

export function subActionToChannelName(subAction: SubscriptionAction): string {
  const channelPrefix = subAction.name
  if (subAction.id) {
    return `${channelPrefix}-${subAction.id}`
  }
  return channelPrefix
}

async function fetchChannelQueues(queueName: string): Promise<void> {
  logger.debug({
    who: 'aquedux-server',
    what: 'fetch queues',
    queueName
  })

  if (queueManager.hasNoQueue(queueName)) {
    // ... there used to be a call to asyncFetch (to subscribe to many queues at once)
    await asyncCreate(queueName)
  } else {
    await until(() => queueManager.isQueueReady(queueName))
  }
}

export async function subscribe(state: Object, subAction: SubscriptionAction): Promise<void> {
  const channelName = subActionToChannelName(subAction)

  if (subAction.id) {
    channelManager.createChannelFromTemplate(subAction)
  }

  if (!channelManager.hasChannel(channelName)) {
    throw new Error(`${channelName} do not match any channel. Did you call addChannelHandlers?`)
  }

  await fetchChannelQueues(channelName)

  logger.debug({ who: 'aquedux-server', what: 'send snapshot', channelName })

  tankManager.subscribe(subAction.tankId, channelName)

  raise(events.EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK, {
    channelName,
    subAction,
    state
  })
}

export function unsubscribe(subAction: SubscriptionAction): void {
  const channelName = subActionToChannelName(subAction)

  tankManager.unsubscribe(subAction.tankId, channelName)

  if (!tankManager.hasSubscribersTo(channelName)) {
    closeQueue(channelName)
  }
}
