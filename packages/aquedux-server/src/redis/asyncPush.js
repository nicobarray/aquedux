// @flow

import until from '../utils/until'
import logger from '../utils/logger'

import configManager from '../managers/configManager'
import queueManager from '../managers/queueManager'

import { asyncQuery } from './connections'

const luaScript = `
  local prefix = ARGV[1]
  local limit = tonumber(ARGV[2])
  local action = ARGV[3]

  local latestFragmentIndex = redis.call('get', prefix .. '-head')
  local latestFragment = prefix .. '-frag-' .. latestFragmentIndex
  local latestFragmentLength = tonumber(redis.call('llen', latestFragment))
  
  if limit > 0 and latestFragmentLength == limit then
      local nextFragment =  prefix .. '-frag-' .. (latestFragmentIndex + 1)
      redis.call('rpush', nextFragment, action)
      redis.call('incr', prefix .. '-head')
  else
      redis.call('rpush', latestFragment, action)
      return 0
  end
`

const asyncPushToRedis = async (name: string, action: Object) =>
  asyncQuery(async connection => {
    const { queueLimit } = configManager.getConfig()
    try {
      // Here the cursor lags behind the real cursor, so we cannot based the fragmentName on it.
      // We need to check, atomically, what is the latest fragment, check its lenght, then rpush
      // to the correct fragment.

      // Do this atomically.
      const ret = await connection.evalAsync(luaScript, 0, name, queueLimit, JSON.stringify(action))

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

const asyncPush = async (name: string, action: Object): Promise<void> => {
  logger.debug({
    who: `redis-${name}`,
    what: 'push action',
    type: action.type
  })

  queueManager.enqueueAction(name, action)
  await until(() => !queueManager.isQueueBusy(name))
  queueManager.lockQueue(name)

  try {
    // Lock the queue to forward all action to redis.
    while (!queueManager.isPushQueueEmpty(name)) {
      // Pop the oldest element and process it.
      const water = queueManager.getNextAction(name).option(null)

      if (water) {
        queueManager.dequeueAction(name)
        await asyncPushToRedis(name, water)
      } else {
        logger.warn('No action found to push to redis when we should')
      }
    }

    // Unlock queue.
    queueManager.unlockQueue(name)
  } catch (err) {
    logger.error({ who: `redis-${name}`, what: 'Error while push an action to redis', err })
  }
}

export default asyncPush
