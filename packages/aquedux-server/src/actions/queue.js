// @flow

import actionTypes from '../constants/actionTypes'
import type { AqueduxAction, ThunkedAction, Dispatch, State } from '../constants/types'

const load = (name: string, subId: string, cursor: number): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_LOAD_QUEUE,
  name,
  subId,
  cursor
})

const unload = (name: string): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_UNLOAD_QUEUE,
  name
})

const enqueueNotification = (name: string): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_ENQUEUE_NOTIFICATION,
  name
})

const dequeueNotification = (name: string): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_DEQUEUE_NOTIFICATION,
  name
})

const enqueueAction = (name: string, action: $FlowFixMe): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_ENQUEUE_ACTION,
  name,
  action
})

const dequeueAction = (name: string): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_DEQUEUE_ACTION,
  name
})

const lock = (name: string): AqueduxAction => ({
  type: actionTypes.queue.AQUEDUX_LOCK_QUEUE,
  name
})

const unlock = (name: string) => ({
  type: actionTypes.queue.AQUEDUX_UNLOCK_QUEUE,
  name
})

const setOptions = (options: any) => ({
  type: actionTypes.queue.AQUEDUX_OPTIONS_SET,
  options
})

const snapshot = (name: string, state: any, size: number) => ({
  type: actionTypes.queue.AQUEDUX_QUEUE_SNAPSHOT,
  name,
  state,
  size
})

const setCursor = (name: string, cursor: number) => ({
  type: actionTypes.queue.AQUEDUX_QUEUE_SET_CURSOR,
  name,
  cursor
})

export default {
  load,
  unload,
  enqueueNotification,
  dequeueNotification,
  enqueueAction,
  dequeueAction,
  lock,
  unlock,
  setOptions,
  snapshot,
  setCursor
}
