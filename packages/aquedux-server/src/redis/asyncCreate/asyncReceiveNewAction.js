// @flow

import logger from '../../utils/logger'
import { raise, events } from '../../utils/eventHub'

import configManager from '../../managers/configManager'
import queueManager from '../../managers/queueManager'

import { asyncQuery } from '../connections'
import asyncSnapshotQueue from '../asyncSnapshotQueue'

async function asyncReceiveNewAction(name: string) {
  return asyncQuery(async connection => {
    logger.debug({
      who: `redis-${name}`,
      what: 'keyspace notification: pop oldest index, fetch the action and dispatch it'
    })

    const { queueLimit } = configManager.getConfig()
    const actionIndex = queueManager.dequeueNotification(name)

    const prevFragmentIndex = actionIndex === 0 || queueLimit === 0 ? 0 : Math.floor((actionIndex - 1) / queueLimit)
    const fragmentIndex = actionIndex === 0 || queueLimit === 0 ? 0 : Math.floor(actionIndex / queueLimit)
    const fragmentName = `${name}-frag-${fragmentIndex}`
    const fragmentActionIndex = queueLimit === 0 ? actionIndex : actionIndex % queueLimit

    try {
      const json = await connection.lindexAsync([fragmentName, fragmentActionIndex])
      const action = JSON.parse(json)

      logger.debug({
        who: 'asyncReceiveNewAction',
        what: 'log fragment infos',
        fragmentName,
        fragmentActionIndex,
        actionIndex,
        type: action.type,
        json
      })

      raise(events.EVENT_ACTION_DISPATCH, action)

      if (prevFragmentIndex !== fragmentIndex) {
        logger.debug({
          who: `queue-${name}`,
          what: 'Snapshot queue',
          fragmentIndex
        })

        await asyncSnapshotQueue(name, actionIndex)
      }
    } catch (err) {
      logger.fatal({
        who: `redis-${name}`,
        what: 'asyncReceiveNewAction error',
        err,
        actionIndex,
        queueLimit,
        fragmentIndex,
        fragmentName,
        fragmentActionIndex
      })
    }
  })
}

export default asyncReceiveNewAction
