import logger from '../utils/logger'
import * as fromConstants from '../utils/constants'
import * as eventHub from '../utils/eventHub'

const clientMiddleware = store => next => action => {
  logger.trace({
    who: 'aquedux-middleware',
    what: 'intercept an action',
    data: action
  })

  // If the action's type is prefixed with AQUA: then dispatch it over Aquedux.
  if (action.type.indexOf(fromConstants.ACTION_PREFIX) === 0) {
    const water = {
      ...action,
      type: action.type.substring(5)
    }
    logger.trace({
      who: 'aquedux-middleware',
      what: 'dispatch action over aquedux',
      data: water
    })

    eventHub.raise(fromConstants.EVENT_SEND, water)
  } else {
    return next(action)
  }
}

export default clientMiddleware
