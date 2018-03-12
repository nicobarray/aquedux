// @flow

import logger from '../../utils/logger'
import { selectors } from '../../reducers'
import { close } from '../connections'

import type { Store } from '../../constants/types'

export default (store: Store, name: string) => {
  logger.debug({
    who: `redis-${name}`,
    what: 'closing queue'
  })
  close(store, selectors.queue.getSubId(store.getState(), name))
}
