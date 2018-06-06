// @flow

import logger from '../utils/logger'

import configManager from '../managers/configManager'
import queueManager from '../managers/queueManager'
import actionCreators from '../actionCreators'
import { asyncQuery } from './connections'

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

async function asyncSnapshotQueue(name: string, size: number) {
  return asyncQuery(async connection => {
    const { queueLimit } = configManager.getConfig()

    try {
      queueManager.lockQueue(name)
      // First lock (with a redis transaction) the queue.
      // Then check if the if the next queue exists (has a first element === snapshot)
      // If not, create the next queue, increment the queue index.
      // Else, bail out of the snapshoting process.
      const cursor = queueManager.getCursor(name)
      const fragmentIndex = queueLimit === 0 ? 0 : Math.floor(cursor / queueLimit)
      const metaName = `${name}-head`

      logger.info({
        who: 'asyncSnapshotQueue',
        name,
        metaName,
        what: 'Attempting to create the ' + fragmentIndex + 'th queue fragment.',
        fragmentIndex,
        cursor,
        queueLimit
      })

      const fragmentSnapName = `${name}-snap-${fragmentIndex}`
      await connection.watchAsync([fragmentSnapName])

      // Else create the fragment snapshot and incr the length key.
      // TODO: Its about time to decide what is the relation between a channel and a queue -> the conclusion will help
      // TODO: determine the correct use of 'snapshots'
      await connection
        .multi()
        .set([fragmentSnapName, JSON.stringify(actionCreators.snapshotQueue(name, queueManager.getState(), size))])
        .execAsync()
    } catch (err) {
      logger.warn({
        who: `redis-${name}`,
        what: 'asyncSnapshotQueue error',
        err
      })
    }

    queueManager.unlockQueue(name)
  })
}

export default asyncSnapshotQueue
