// @flow

import actionTypes from './constants/actionTypes'

export const snapshotChannel = (channelOrTemplateName: string, id: string, snapshot: Object) => ({
  type: actionTypes.channel.AQUEDUX_CHANNEL_SNAPSHOT,
  timestamp: Date.now(),
  channelOrTemplateName,
  id,
  snapshot
})

export const snapshotQueue = (name: string, state: any, size: number) => ({
  type: actionTypes.queue.AQUEDUX_QUEUE_SNAPSHOT,
  name,
  state,
  size
})

export const close = () => ({
  type: actionTypes.api.AQUEDUX_SERVER_CLOSE
})
