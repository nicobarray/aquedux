// @flow

import reducr from 'reducr'
import head from 'lodash/head'
import tail from 'lodash/tail'

import type { QueueState, QueueInnerStateType } from '../constants/types'
import actionTypes from '../constants/actionTypes'

export const initialState: QueueState = {
  name: '',
  cursor: 0,
  notificationQueue: [],
  pushQueue: [],
  innerState: 'QUEUE_STATE_CREATED',
  subId: undefined
}

const reducer = reducr.default(initialState, {
  [actionTypes.queue.AQUEDUX_LOAD_QUEUE]: (prevState, action) => ({
    ...initialState,
    name: action.name,
    subId: action.subId,
    cursor: action.cursor,
    innerState: 'QUEUE_STATE_LOADING'
  }),
  [actionTypes.queue.AQUEDUX_ENQUEUE_NOTIFICATION]: (prevState, action) => ({
    ...prevState,
    cursor: prevState.cursor + 1,
    notificationQueue: [...prevState.notificationQueue, prevState.cursor]
  }),
  [actionTypes.queue.AQUEDUX_DEQUEUE_NOTIFICATION]: (prevState, action) => ({
    ...prevState,
    notificationQueue: tail(prevState.notificationQueue)
  }),
  [actionTypes.queue.AQUEDUX_ENQUEUE_ACTION]: (prevState, action) => ({
    ...prevState,
    pushQueue: [...prevState.pushQueue, action.action]
  }),
  [actionTypes.queue.AQUEDUX_DEQUEUE_ACTION]: (prevState, action) => ({
    ...prevState,
    pushQueue: tail(prevState.pushQueue)
  }),
  [actionTypes.queue.AQUEDUX_LOCK_QUEUE]: (prevState, action) => ({
    ...prevState,
    innerState: 'QUEUE_STATE_BUSY'
  }),
  [actionTypes.queue.AQUEDUX_UNLOCK_QUEUE]: (prevState, action) => ({
    ...prevState,
    innerState: 'QUEUE_STATE_AVAILABLE'
  }),
  [actionTypes.queue.AQUEDUX_QUEUE_SET_CURSOR]: (prevState, action) => ({
    ...prevState,
    cursor: action.cursor
  })
})

export default reducer

export const selectors = {
  getName: (state: QueueState): string => state.name,
  getCursor: (state: QueueState): number => state.cursor,
  getNotificationQueue: (state: QueueState): Array<number> => state.notificationQueue,
  getPushQueue: (state: QueueState): Array<Object> => state.pushQueue,
  getInnerState: (state: QueueState): QueueInnerStateType => state.innerState,
  getSubId: (state: QueueState): ?string => state.subId,
  // FIXME: reselect here?
  getNextNotification: (state: QueueState): number => head(state.notificationQueue),
  getNextAction: (state: QueueState): $FlowFixMe => head(state.pushQueue),
  isPushQueueEmpty: (state: QueueState): boolean => state.pushQueue.length === 0,
  isQueueBusy: (state: QueueState): boolean => state.innerState === 'QUEUE_STATE_BUSY',
  isReady: (state: QueueState): boolean =>
    state.innerState === 'QUEUE_STATE_AVAILABLE' || state.innerState === 'QUEUE_STATE_BUSY'
}
