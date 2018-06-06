// @flow

import queueManager from '../../managers/queueManager'

import asyncReceiveNewAction from './asyncReceiveNewAction'

const validMessages = ['rpush', 'rpushx']

function handleMessage(name: string) {
  return function(pattern: string, channel: string, message: string) {
    if (!validMessages.find(type => type === message)) {
      return
    }

    queueManager.enqueueNotification(name)

    asyncReceiveNewAction(name)
  }
}

export default handleMessage
