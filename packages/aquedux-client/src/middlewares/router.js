// @flow

import actionTypes from '../constants/actionTypes'
import configManager from '../managers/configManager'
import { raise, events } from '../utils/eventHub'

const internalActionTypes = [actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN, actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE]
const isInternalActionType = actionType => internalActionTypes.indexOf(actionType) !== -1
const isWiredActionType = actionType => {
  const { hydratedActionTypes } = configManager.getConfig()

  return hydratedActionTypes.indexOf(actionType) !== -1 || isInternalActionType(actionType)
}

export default (_store: any) => (next: any) => (action: any) => {
  const { type } = action

  if (isWiredActionType(type)) {
    raise(events.EVENT_ACTION_SEND, action)

    if (!isInternalActionType(type)) {
      // Only internals wired action types should reach reducers synchronously
      return
    }
  } else if (type === actionTypes.AQUEDUX_CLIENT_MESSAGE_RECEIVED) {
    const { originalActionType, ...originalAction } = action

    return next({
      ...originalAction,
      type: originalActionType
    })
  }

  return next(action)
}
