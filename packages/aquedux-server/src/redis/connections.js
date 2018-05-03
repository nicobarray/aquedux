import redis from 'redis'
import bluebird from 'bluebird'
import omit from 'lodash/omit'
import { v4 } from 'uuid'

import configManager from '../managers/configManager'

import logger from '../utils/logger'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

let connections = {}
let initial = null

const retry_strategy = options => {
  if (options.attempt > 3) {
    // End reconnecting with built in error
    logger.error({ who: 'redis-driver', what: 'exit process on failed retrials' })
    process.exit(1)
  }
  return Math.min(options.attempt * options.attempt * 100, 3000)
}

/**
 *  Create the initial Redis connection.
 *
 *  Must be called after configManager.setConfig, else the redisHost and redisPort
 *  would default and thus never used as intended.
 */
export const initRedisConnection = () => {
  const { redisHost, redisPort } = configManager.getConfig()

  this.initial = redis.createClient(redisPort, redisHost, {
    retry_strategy
  })
}

const hookOnEvents = connection => {
  connection.on('error', err => {
    logger.error({ who: 'redis-driver', err })
  })
  connection.on('reconnecting', ({ delay, attempt }) =>
    logger.warn({
      who: 'redis-driver',
      what: `attempting reconnection (${attempt}) with delay ${delay}ms`
    })
  )
  connection.on('connect', () => {
    logger.debug({
      who: 'redis-driver',
      what: 'Connected to Redis successfuly'
    })
  })
  connection.on('ready', () => {
    logger.debug({
      who: 'redis-driver',
      what: 'Connection is ready'
    })
  })
}

hookOnEvents(initial)

export function UndefinedConnectionException(message) {
  this.message = message
  this.name = 'UndefinedConnectionException'
}

export const duplicate = () => {
  const next = initial.duplicate()
  hookOnEvents(next)
  const id = v4()
  connections = { ...connections, [id]: next }
  logger.debug({
    who: 'redis-driver',
    what: 'duplicate connection',
    id
  })
  return id
}

export const close = (store, id) => {
  const conn = connections[id]
  if (conn) {
    conn.quit()
    connections = omit(connections, id)
    logger.debug({
      who: 'redis-driver',
      what: 'close connection',
      id
    })
  } else {
    throw new UndefinedConnectionException(id)
  }
}

export const query = callback => {
  logger.trace({
    who: 'redis-driver',
    what: 'querying redis'
  })
  const conn = initial.duplicate()
  callback(conn, () => conn.quit())
}

export const asyncQuery = async query => {
  logger.trace({
    who: 'redis-driver',
    what: 'querying redis'
  })
  try {
    await query(initial)
  } catch (err) {
    logger.error({
      who: 'redis-driver::asyncQuery',
      what: 'catch error while querying redis',
      err
    })
  }
}

export const get = id => {
  const conn = connections[id]
  if (conn) {
    return conn
  } else {
    throw new UndefinedConnectionException(id)
  }
}

export const getPrimary = () => {
  return initial
}
