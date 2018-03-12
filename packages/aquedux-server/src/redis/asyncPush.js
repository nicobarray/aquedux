// @flow

import fs from 'fs'

import head from 'lodash/head'
import tail from 'lodash/tail'

import { asyncQuery } from './connections'
import until from './until'
import { selectors } from '../reducers'
import actions from '../actions'
import logger from '../utils/logger'
import configManager from '../managers/configManager'
import asyncSnapshotQueue from './asyncSnapshotQueue'
import type { Store } from '../constants/types'

const luaScript = `
  local prefix = ARGV[1]
  local limit = tonumber(ARGV[2])
  local action = ARGV[3]

  local latestFragmentIndex = redis.call('get', prefix .. '-head')
  local latestFragment = prefix .. '-frag-' .. latestFragmentIndex
  local latestFragmentLength = tonumber(redis.call('llen', latestFragment))
  
  if latestFragmentLength == limit then
      local nextFragment =  prefix .. '-frag-' .. (latestFragmentIndex + 1)
      redis.call('rpush', nextFragment, action)
      redis.call('incr', prefix .. '-head')
  else
      redis.call('rpush', latestFragment, action)
      return 0
  end
`

const asyncPushToRedis = async (store: Store, name: string, action: Object) =>
  asyncQuery(async connection => {
    try {
      // Here the cursor lags behind the real cursor, so we cannot based the fragmentName on it.
      // We need to check, atomically, what is the latest fragment, check its lenght, then rpush
      // to the correct fragment.

      // Do this atomically.
      const limit = selectors.queue.getQueueLimit(store.getState())
      const ret = await connection.evalAsync(luaScript, 0, name, limit, JSON.stringify(action))

      logger.debug({
        who: name,
        what: 'LUA PUSH',
        type: action.type,
        ret
      })
    } catch (err) {
      logger.warn({
        what: 'asyncPushToRedis failure',
        type: action.type,
        err
      })
    }
  })

const asyncPush = async (store: Store, name: string, water: Object): Promise<void> => {
  const innerState = selectors.queue.getInnerState(store.getState(), name)

  if (innerState === 'QUEUE_STATE_PURGED') {
    logger.debug({ who: `redis-${name}`, what: 'the queue is purged. ignoring action' })
    return
  }

  logger.debug({
    who: `redis-${name}`,
    what: 'push action',
    type: water.type
  })

  store.dispatch(actions.queue.enqueueAction(name, water))

  try {
    await until(() => !selectors.queue.isQueueBusy(store.getState(), name))
    // Lock the queue to forward all action to redis.
    store.dispatch(actions.queue.lock(name))
    while (!selectors.queue.isPushQueueEmpty(store.getState(), name)) {
      // Pop the oldest element and process it.
      const nextAction = selectors.queue.getNextAction(store.getState(), name)
      store.dispatch(actions.queue.dequeueAction(name))
      await asyncPushToRedis(store, name, nextAction)
    }
    // Unlock queue.
    store.dispatch(actions.queue.unlock(name))
  } catch (err) {
    logger.error({ who: `redis-${name}`, what: 'Error while push an action to redis', err })
  }
}

export default asyncPush
