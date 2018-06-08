// @flow

import until from '../../utils/until'
import logger from '../../utils/logger'
import { raise, events } from '../../utils/eventHub'

import configManager from '../../managers/configManager'
import queueManager from '../../managers/queueManager'

import { duplicate, get, asyncQuery } from '../connections'
import getsetLatestFragmentIndexAsync from './getsetLatestFragmentIndexAsync'
import handleMessage from './handleMessage'

// Create a queue, load it from redis (or create it) and
// register itself to the store. To call only if the queue does not exists
// yet. Else, you'll have duplicated notifications and invalid state.
async function asyncCreate(name: string): Promise<void> {
  logger.debug({ who: `redis-${name}`, what: 'asyncCreate' })

  if (queueManager.hasQueue(name)) {
    logger.error({ who: `redis-${name}`, what: 'asyncCreate called more than one time for the same queue!' })
    return
  }

  const subId = duplicate()
  const sub = get(subId)

  // Notification setup.
  if (process.env.NODE_ENV !== 'production') {
    // This is not required if it is in the redis configuration file.
    sub.config('SET', 'notify-keyspace-events', 'Klg')
  }

  sub.on('pmessage', handleMessage(name))

  sub.psubscribe(`__keyspace@*__:${name}-frag-*`, (err, reply) => {
    if (err) {
      logger.warn({
        who: `redis-${name}`,
        what: 'key-space notification setup',
        err
      })
    } else {
      logger.debug({
        who: `redis-${name}`,
        what: 'key-space notification setup',
        reply
      })
    }
  })

  logger.debug({ who: `redis-${name}`, what: 'startup' })

  const { queueLimit } = configManager.getConfig()

  queueManager.createQueue(name, subId)
  queueManager.lockQueue(name)

  // Action fetching and queue/fragment in redis initialisation.
  await asyncQuery(async connection => {
    try {
      // First check if the queue is new.
      // Get the latest queue fragment name.
      const queueLength = await getsetLatestFragmentIndexAsync(connection, name)
      const latestFragmentName = `${name}-frag-${queueLength}`
      const latestFragmentSnapName = `${name}-snap-${queueLength}`

      // Now get the current fragment length to reduce it.
      let actionQueue = await connection.lrangeAsync([latestFragmentName, 0, -1])

      /*
        Compute the initial cursor. The cursor is the index along the whole queue.
        So if a queue is composed of 3 fragments of 5 elements each and 1 last
        fragment of 2 element, the initial cursor equals (3x5+2)=17. 
      */
      const fragmentLength = await connection.llenAsync(latestFragmentName)

      const initialCursor = queueLength * queueLimit + parseInt(fragmentLength, 10)

      logger.debug({
        who: `redis-${name}`,
        what: 'load latest fragment',
        latestFragmentName,
        latestFragmentLength: fragmentLength,
        initialCursor,
        queueLimit
      })

      queueManager.setCursor(name, initialCursor)

      let snapshot = await connection.getAsync(latestFragmentSnapName)

      if (snapshot) {
        actionQueue.unshift(snapshot)
      } else {
        logger.info({
          who: `redis-${name}`,
          what: 'No snapshot found for fragment ' + queueLength
        })
      }

      // Reduce all actions to local redux state.
      while (actionQueue.length > 0) {
        const action = JSON.parse(actionQueue.shift())
        raise(events.EVENT_ACTION_DISPATCH, { ...action, meta: { ...action.meta, ignore: true } })
      }

      // At last, we unlock the queue to be updated by any incoming action.
      queueManager.unlockQueue(name)
    } catch (err) {
      logger.warn({
        who: `redis-${name}`,
        what: 'Error while replaying queue actions',
        err,
        stack: err.stack
      })
    }
  })

  // Just for logging.
  const duration = await until(() => queueManager.isQueueReady(name))
  const info = queueManager
    .getCursor(name)
    .map(cursor => (queueLimit === 0 ? cursor : cursor % queueLimit))
    .map(length => {
      length, duration
    })
    .option({})

  logger.debug({
    who: `queue-${name}`,
    what: 'reduce queue',
    ...info
  })
}

export default asyncCreate
