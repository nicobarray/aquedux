// @flow

import asyncCreate from './asyncCreate'
import { asyncQuery } from './connections'
import { selectors } from '../reducers'
import logger from '../utils/logger'

import type { Store, QueueState } from '../constants/types'

export default async (store: Store, pattern: string): Promise<void> => {
  return asyncQuery(async connection => {
    const backId = selectors.queue.getId(store.getState())
    try {
      const keys = await connection.keysAsync(`${pattern}`)
      logger.debug({
        who: `redis-${backId}`,
        what: `asyncFetch: fetched keys for ${pattern}`,
        keys
      })
      await Promise.all(
        keys.filter(qName => !selectors.queue.hasQueue(store.getState(), qName)).map(qName => asyncCreate(store, qName))
      )
    } catch (err) {
      logger.warn({
        who: `redis-${backId}`,
        what: 'asyncFetch: error during asyncQuery',
        err
      })
    }
  })
}
