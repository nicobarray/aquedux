import logger from '../utils/logger'
import * as fromConstants from '../utils/constants'
import * as eventHub from '../utils/eventHub'
import configManager from '../managers/configManager'

const clientMiddleware = _store => next => action => {
  logger.trace({
    who: 'aquedux-middleware',
    what: 'intercept an action',
    data: action
  })

  const { hydratedActionTypes } = configManager.getConfig()
  // Dispatch it over Aquedux if needed.
  if (hydratedActionTypes.indexOf(action.type) !== -1) {
    logger.trace({
      who: 'aquedux-middleware',
      what: 'dispatch action over aquedux',
      data: water
    })

    eventHub.raise(fromConstants.EVENT_SEND, action)
  } else {
    return next(action)
  }
}

export default clientMiddleware
