// @flow

import logger from '../utils/logger'
import queueManager from '../managers/queueManager'
import { close } from './connections'

export default (name: string) => {
  logger.debug({
    who: `redis-${name}`,
    what: 'closing queue'
  })

  close(name)

  queueManager.unloadQueue(name)
}
