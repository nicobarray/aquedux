// @flow

import configManager from '../managers/configManager'
import type { Store } from '../constants/types'
import { asyncQuery } from './connections'
import actions from '../actions'
import { selectors } from '../reducers'
import logger from '../utils/logger'

const { queueLimit } = configManager.getConfig()
// TODO: Check if this must be used.
/*
const luaScript = `
local prefix = ARGV[1]
local limit = tonumber(ARGV[2])
local action = ARGV[3]

// local latestFragmentIndex = redis.call('get', prefix .. '-head')
// local latestFragmentSnapshotName = prefix .. '-snap-' .. latestFragmentIndex
// local latestFragmentSnapshot = redis.call('get', latestFragmentSnapshotName)

if limit > 0 and latestFragmentSnapshot == nil then
    local nextFragment =  prefix .. '-frag-' .. (latestFragmentIndex + 1)
    redis.call('rpush', nextFragment, action)
    redis.call('incr', prefix .. '-head')
    return 1
else
    redis.call('rpush', latestFragment, action)
    return 0
end
`*/

const asyncSnapshotQueue = async (store: Store, name: string, size: number) =>
  asyncQuery(async connection => {
    const { doFragmentSnapshot } = configManager.getConfig()
    try {
      store.dispatch(actions.queue.lock(name))
      // First lock (with a redis transaction) the queue.
      // Then check if the if the next queue exists (has a first element === snapshot)
      // If not, create the next queue, increment the queue index.
      // Else, bail out of the snapshoting process.
      const cursor = selectors.queue.getCursor(store.getState(), name)
      const fragmentIndex = queueLimit === 0 ? 0 : Math.floor(cursor / queueLimit)
      const metaName = `${name}-head`
      logger.info({
        who: 'asyncSnapshotQueue',
        name,
        metaName,
        what: 'Try to snapshot. Creating ' + fragmentIndex + 'th queue fragment.',
        fragmentIndex,
        cursor,
        queueLimit
      })
      const fragmentSnapName = `${name}-snap-${fragmentIndex}`
      await connection.watchAsync([fragmentSnapName])
      // Else create the fragment snapshot and incr the length key.
      await connection
        .multi()
        .set([
          fragmentSnapName,
          JSON.stringify(actions.queue.snapshot(name, doFragmentSnapshot(store.getState()), size))
        ])
        .execAsync()
    } catch (err) {
      logger.warn({
        who: `redis-${name}`,
        what: 'asyncSnapshotQueue failure',
        err
      })
    }
    store.dispatch(actions.queue.unlock(name))
  })

export default asyncSnapshotQueue
