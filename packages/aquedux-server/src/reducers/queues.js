// @flow

import reducr from 'reducr'
import { v4 } from 'uuid'

import logger from '../utils/logger'

import actionTypes, { flatTypes } from '../constants/actionTypes'
import queue, { selectors as queueSelectors } from './queue'
import tank, { initialState as tankInitialState, selectors as tankSelectors } from './tank'
import channels, { initialState as channelsInitialState, selectors as channelsSelectors } from './channels'

import type { QueueState, AqueduxState } from '../constants/types'

export const initialState: AqueduxState = {
  id: v4(),
  removeQueueType: '',
  options: {
    queueLimit: 0,
    statefullTypes: [],
    routePrefix: '/undefined'
  },
  queues: {},
  tanks: tankInitialState,
  channels: channelsInitialState
}

// FIXME: fix reducr to avoid writing reducr.default
const reducer = reducr.default(initialState, {
  [actionTypes.queue.AQUEDUX_LOAD_QUEUE]: (prevState, action) => ({
    ...prevState,
    queues: {
      ...prevState.queues,
      [action.name]: queue(undefined, action)
    }
  }),
  [actionTypes.queue.AQUEDUX_UNLOAD_QUEUE]: (prevState, action) => {
    const { [action.name]: toRemove, ...otherQueues } = prevState.queues
    return {
      ...prevState,
      queues: otherQueues
    }
  },
  [actionTypes.api.AQUEDUX_REMOVE_TYPE_SET]: (prevState, action) => {
    return {
      ...prevState,
      removeQueueType: action.typeToSet
    }
  },
  [actionTypes.queue.AQUEDUX_OPTIONS_SET]: (prevState, action) => {
    return {
      ...prevState,
      options: action.options
    }
  },
  default: (prevState, action) => {
    // If the action contains a name, it is probably an action that impact a single queue.
    // Therefore we forward the action to the queue reducers.
    if (flatTypes.hasOwnProperty(action.type) && action.name && prevState.queues.hasOwnProperty(action.name))
      return {
        ...prevState,
        queues: {
          ...prevState.queues,
          [action.name]: queue(prevState.queues[action.name], action)
        }
      }
    else if (actionTypes.tank.hasOwnProperty(action.type)) {
      return {
        ...prevState,
        tanks: tank(prevState.tanks, action)
      }
    } else if (actionTypes.channel.hasOwnProperty(action.type)) {
      return {
        ...prevState,
        channels: channels(prevState.channels, action)
      }
    } else {
      return prevState
    }
  }
})

export default reducer

const getQueue = (state: AqueduxState, name: string) => {
  const queue = state.queues[name]
  if (queue) return queue
  throw new Error(`The queue ${name} does not exists!`)
}

const findQueueAndForwardIt = selector => (state: AqueduxState, name: string) => selector(getQueue(state, name))

export const selectors = {
  listQueues: (state: AqueduxState) => state.queues,
  getName: findQueueAndForwardIt(queueSelectors.getName),
  getCursor: findQueueAndForwardIt(queueSelectors.getCursor),
  getNotificationQueue: findQueueAndForwardIt(queueSelectors.getNotificationQueue),
  getPushQueue: findQueueAndForwardIt(queueSelectors.getPushQueue),
  getInnerState: findQueueAndForwardIt(queueSelectors.getInnerState),
  getSubId: findQueueAndForwardIt(queueSelectors.getSubId),
  getNextNotification: findQueueAndForwardIt(queueSelectors.getNextNotification),
  getNextAction: findQueueAndForwardIt(queueSelectors.getNextAction),
  // FIXME: reselect here?
  isPushQueueEmpty: findQueueAndForwardIt(queueSelectors.isPushQueueEmpty),
  isQueueBusy: findQueueAndForwardIt(queueSelectors.isQueueBusy),
  isReady: findQueueAndForwardIt(queueSelectors.isReady),
  hasQueue: (state: AqueduxState, name: string): boolean => !!state.queues[name],
  isReady: (state: AqueduxState, name: string): boolean => {
    try {
      const queue = getQueue(state, name)
      return queueSelectors.isReady(queue)
    } catch (err) {
      logger.warn({ who: 'isReady selector', what: 'queue not found', name })
      return false
    }
  },
  getId: (state: AqueduxState) => {
    return state.id
  },
  isRemoveQueueType: (state: AqueduxState, type: string): boolean => type === state.removeQueueType,
  isStatefull: (state: AqueduxState, actionType: string): boolean => state.options.statefullTypes.includes(actionType),
  getQueueLimit: (state: AqueduxState): number => state.options.queueLimit,
  getRoutePrefix: (state: AqueduxState): string => state.options.routePrefix
}
