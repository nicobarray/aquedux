// @flow

import logger from '../utils/logger'
import queueManager from '../managers/queueManager'
import asyncCreate from './asyncCreate'
import { asyncQuery } from './connections'

export default async (pattern: string): Promise<void> => {
  return asyncQuery(async connection => {
    try {
      const keys = await connection.keysAsync(`${pattern}`)
      await Promise.all(keys.filter(queueManager.hasNoQueue).map(asyncCreate))
    } catch (err) {
      logger.warn({
        who: `redis`,
        what: 'asyncFetch error',
        err
      })
    }
  })
}
