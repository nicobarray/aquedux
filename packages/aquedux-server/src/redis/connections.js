// @flow

import redis from 'redis'
import bluebird from 'bluebird'
import omit from 'lodash/omit'
import { v4 } from 'uuid'

import configManager from '../managers/configManager'
import queueManager from '../managers/queueManager'

import logger from '../utils/logger'
import { register, unregister, events } from '../utils/eventHub'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

let connections = {}
let initial: any = null

const retry_strategy = options => {
  if (options.attempt > 3) {
    // End reconnecting with built in error
    logger.error({ who: 'redis-driver', what: 'exit process on failed retrials' })
    process.exit(1)
  }
  return Math.min(options.attempt * options.attempt * 100, 3000)
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

/**
 *  Create the initial Redis connection.
 *
 *  Must be called after configManager.setConfig, else the redisHost and redisPort
 *  would default and thus never used as intended.
 */
export const initRedisConnection = () => {
  const { redisHost, redisPort } = configManager.getConfig()

  initial = redis.createClient(redisPort, redisHost, {
    retry_strategy
  })

  hookOnEvents(initial)

  const onServerClose = () => {
    if (initial) {
      initial.quit()
      initial = null
    }

    Object.keys(connections).forEach(id => {
      const conn = connections[id]
      conn.quit()
    })

    connections = {}

    unregister(events.EVENT_SERVER_CLOSE, onServerClose)
  }

  register(events.EVENT_SERVER_CLOSE, onServerClose)
}

export const duplicate = () => {
  const conn = initial.duplicate()
  hookOnEvents(conn)
  const id = v4()
  connections = { ...connections, [id]: conn }
  logger.debug({
    who: 'redis-driver',
    what: 'duplicate connection',
    id
  })
  return id
}

export const close = (name: string) => {
  const id = queueManager.getSubId(name).option(null)

  if (!id) {
    throw new Error(`Channel ${name} do not exists`)
  }

  const conn = connections[id]

  conn.quit()
  connections = omit(connections, id)
}

export const query = (callback: Function) => {
  const conn = initial.duplicate()
  callback(conn, () => conn.quit())
}

export async function asyncQuery(query: any => Promise<void>) {
  try {
    await query(initial)
  } catch (err) {
    logger.error({
      who: 'redis',
      what: 'asyncQuery error',
      err
    })
  }
}

export function get(id: string) {
  const conn = connections[id]
  if (conn) {
    return conn
  } else {
    throw new Error(`The redis connection ${id} does not exists`)
  }
}
