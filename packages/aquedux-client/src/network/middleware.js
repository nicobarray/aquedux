import logger from '../utils/logger'
import * as fromConstants from '../utils/constants'
import actionTypes from '../constants/actionTypes'
import * as eventHub from '../utils/eventHub'
import configManager from '../managers/configManager'

const internalActionTypes = [actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN, actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE]
const isInternalActionType = actionType => internalActionTypes.indexOf(actionType) !== -1

const isWiredActionType = actionType => {
  const { hydratedActionTypes } = configManager.getConfig()

  return (
    hydratedActionTypes.indexOf(actionType) !== -1 ||
    isInternalActionType(actionType) ||
    actionType === actionTypes.AQUEDUX_CLIENT_PING
  )
}

const clientMiddleware = _store => next => action => {
  logger.trace({
    who: 'aquedux-middleware',
    what: 'intercept an action',
    data: action
  })

  // Dispatch it over Aquedux if needed.
  if (isWiredActionType(action.type)) {
    logger.trace({
      who: 'aquedux-middleware',
      what: 'dispatch action over aquedux',
      data: water
    })
    eventHub.raise(fromConstants.EVENT_SEND, action)
    if (!isInternalActionType(action.type)) {
      // Only internals wired action types should reach reducers synchronously
      return
    }
  } else if (action.type === actionTypes.AQUEDUX_CLIENT_MESSAGE_RECEIVED) {
    const { originalActionType, ...originalAction } = action
    return next({
      ...originalAction,
      type: originalActionType
    })
  }
  return next(action)
}

export default clientMiddleware
