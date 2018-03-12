// @flow

import handleNotification from './handleNotification'
import logger from '../../utils/logger'
import actionTypes from '../../actionTypes'
import actions from '../../actions'
import { selectors } from '../../reducers'
import { duplicate, get, asyncQuery } from '../connections'
import until from '../until'
import getsetLatestFragmentIndexAsync from './getsetLatestFragmentIndexAsync'

import type { Store } from '../../constants/types'

// Create a queue, load it from redis (or create it) and
// register itself to the store. To call only if the queue does not exists
// yet. Else, you'll have duplicated notifications and invalid state.
export default async (store: Store, name: string): Promise<void> => {
  logger.debug({ who: `redis-${name}`, what: 'asyncCreate' })

  if (selectors.queue.hasQueue(store.getState(), name)) {
    logger.error({ who: `redis-${name}`, what: 'asyncCreate called more than one time for the same queue!' })
    return
  }

  const subId = duplicate(store)
  store.dispatch(actions.queue.load(name, subId, 0))

  const sub = get(subId)

  // Notification setup.
  if (process.env.NODE_ENV !== 'production') {
    // This is not required if it is in the redis configuration file.
    sub.config('SET', 'notify-keyspace-events', 'Klg')
  }

  sub.on('pmessage', handleNotification(store, name))
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

  // Action fetching and queue/fragment in redis initialisation.
  await asyncQuery(async connection => {
    try {
      // First check if the queue is new.
      // Get the latest queue fragment name.
      const queueLength = await getsetLatestFragmentIndexAsync(connection, name)
      const latestFragmentName = `${name}-frag-${queueLength}`
      const latestFragmentSnapName = `${name}-snap-${queueLength}`

      // Now get the current fragment length to reduce it.
      let fetchedActions = await connection.lrangeAsync([latestFragmentName, 0, -1])

      /*
        Compute the initial cursor. The cursor is the index along the whole queue.
        So if a queue is composed of 3 fragments of 5 elements each and 1 last
        fragment of 2 element, the initial cursor equals 17. 
      */
      const fragmentLength = await connection.llenAsync(latestFragmentName)
      const limit = selectors.queue.getQueueLimit(store.getState())
      const initialCursor = queueLength * limit + parseInt(fragmentLength, 10)
      logger.debug({
        who: `redis-${name}`,
        what: 'load latest fragment',
        latestFragmentName,
        latestFragmentLength: fragmentLength,
        initialCursor,
        limit
      })
      store.dispatch(actions.queue.setCursor(name, initialCursor))

      let fetchedSnapshot = await connection.getAsync(latestFragmentSnapName)
      // First reduce the snapshot.
      if (fetchedSnapshot !== null) {
        const action = JSON.parse(fetchedSnapshot)
        store.dispatch({ ...action, meta: { ...action.meta, ignore: true } })
      } else {
        logger.info({
          who: `redis-${name}`,
          what: 'No snapshot found for fragment ' + queueLength
        })
      }

      // Reduce all actions to local redux state.
      while (fetchedActions.length > 0) {
        const [head, ...rest] = fetchedActions
        fetchedActions = rest
        const action = JSON.parse(head)
        store.dispatch({ ...action, meta: { ...action.meta, ignore: true } })
      }

      // At last, the initialisation is finished.
      store.dispatch(actions.queue.unlock(name))
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
  const duration = await until(() => selectors.queue.isReady(store.getState(), name))
  const length = selectors.queue.getCursor(store.getState(), name) % selectors.queue.getQueueLimit(store.getState())
  logger.debug({
    who: `queue-${name}`,
    what: `reducing this queue took ${duration} milliseconds for ${length} actions`
  })
}
