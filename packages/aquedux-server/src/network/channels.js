// @flow

import type { State, Action, Dispatch, Store } from '../constants/types'
import channelManager from '../managers/channelManager'
import logger from '../utils/logger'
import * as eventHub from '../utils/eventHub'
import actions from '../actions'
import { selectors } from '../reducers'

// A function that takes the redux state and returns the data necessary
// to initialize a newly subscribbed client to this channel.
export const addChannel = (dispatch: Dispatch) => (
  name: string,
  predicate: Action => boolean,
  reducer: (State, Action) => Object,
  matchPattern: string
) => {
  if (!matchPattern) {
    throw new Error(`Cannot add a generic channel ${name} without match pattern. Check your addChannel call args.`)
  }
  // Keep a reference in redux.
  dispatch(actions.channel.define(name, matchPattern))
  // Store channel handlers (non-serializable) in the channel manager.
  channelManager.addChannelHandlers(name, predicate, reducer)
}

// A function that takes the redux state and returns the data necessary
// to initialize a newly subscribbed client to this channel.
export const addChannelTemplate = (dispatch: Dispatch) => (
  name: string,
  createPredicate: string => Action => boolean,
  reducer: Object => (State, Action) => Object
) => {
  // Keep a reference in redux.
  dispatch(actions.channel.defineTemplate(name))
  // Store channel handlers (non-serializable) in the channel manager.
  channelManager.addTemplateHandlers(name, createPredicate, reducer)
}

export const forwardActionToChannelSubscribers = (store: Store, action: Action) => {
  logger.trace({
    who: 'subscribe',
    what: 'action road',
    where: 'forward to channels',
    step: 6,
    type: action.type
  })
  const state = store.getState()
  // First, list all other tanks and ignore the action sender.
  const matchingTanks = selectors.tank.listOthers(action.tankId, state).filter(tank => {
    // Here tank.channels has everything needed to compute a valid predicate
    // if the channel is a template.

    return tank.channels.some(channelName => {
      if (action.origin && action.origin.split(':')[1] === tank.id) return false
      return channelManager.getChannelHandlersFromName(channelName).predicate(action)
    })
  })

  matchingTanks.forEach(tank => {
    eventHub.raise(eventHub.EVENT_SEND_ACTION_TO_TANK, {
      tankId: tank.id,
      action
    })
  })
}
