// @flow

import head from 'lodash/head'
import tail from 'lodash/tail'

import { asyncQuery } from '../connections'
import logger from '../../utils/logger'
import { selectors } from '../../reducers'
import actions from '../../actions'
import type { Store } from '../../constants/types'
import asyncSnapshotQueue from '../asyncSnapshotQueue'

const asyncReceiveNewAction = async (store: Store, name: string) =>
  asyncQuery(async connection => {
    logger.debug({
      who: `redis-${name}`,
      what: 'keyspace notification: pop oldest index, fetch the action and dispatch it',
      order: selectors.queue.getNotificationQueue(store.getState(), name)
    })

    const actionIndex = selectors.queue.getNextNotification(store.getState(), name)
    store.dispatch(actions.queue.dequeueNotification(name))

    let res = ''
    const limit = selectors.queue.getQueueLimit(store.getState())
    const prevFragmentIndex = actionIndex === 0 ? 0 : Math.floor((actionIndex - 1) / limit)
    const fragmentIndex = actionIndex === 0 ? 0 : Math.floor(actionIndex / limit)
    const fragmentName = `${name}-frag-${fragmentIndex}`
    const fragmentActionIndex = actionIndex % limit
    try {
      res = await connection.lindexAsync([fragmentName, fragmentActionIndex])
      const action = JSON.parse(res)

      logger.debug({
        who: 'asyncReceiveNewAction',
        what: 'log fragment infos',
        fragmentName,
        fragmentActionIndex,
        actionIndex,
        type: action.type,
        res
      })
      store.dispatch(action)

      if (prevFragmentIndex !== fragmentIndex) {
        logger.debug({
          who: `redis-${name}`,
          what: 'Snapshot start.',
          fragmentIndex
        })
        await asyncSnapshotQueue(store, name, actionIndex)
        logger.debug({
          who: `redis-${name}`,
          what: 'Snapshot step finished.'
        })
      }
    } catch (err) {
      logger.fatal({
        who: `redis-${name}`,
        what: 'asyncReceiveNewAction error',
        err,
        res,
        actionIndex,
        limit,
        fragmentIndex,
        fragmentName,
        fragmentActionIndex
      })
    }
  })

export default asyncReceiveNewAction
