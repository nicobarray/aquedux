// @flow

import { type Store } from 'redux'

import actionTypes from '../constants/actionTypes'
import { raise, events } from '../utils/eventHub'

export default (_store: Store) => (next: Function) => (action: Object) => {
  const { type } = action

  if (type === actionTypes.api.AQUEDUX_SERVER_CLOSE) {
    raise(events.EVENT_SERVER_CLOSE)
  }

  next(action)
}
