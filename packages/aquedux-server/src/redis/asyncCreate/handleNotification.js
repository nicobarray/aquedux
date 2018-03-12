// @flow

import asyncReceiveNewAction from './asyncReceiveNewAction'
import logger from '../../utils/logger'
import { selectors } from '../../reducers'
import actions from '../../actions'

import type { Store } from '../../constants/types'

const handleNotification = (store: Store, name: string) => (pattern: string, channel: string, message: string) => {
  logger.debug({
    who: `queue-${name}`,
    what: 'handleNotification',
    message,
    cursor: selectors.queue.getCursor(store.getState(), name)
  })
  if (message === 'rpush' || message === 'rpushx') {
    logger.debug({
      who: `queue-${name}`,
      what: 'enqueue notification e.g local cursor++',
      pattern,
      channel,
      message
    })
    store.dispatch(actions.queue.enqueueNotification(name))
    asyncReceiveNewAction(store, name)
  }
}

export default handleNotification
