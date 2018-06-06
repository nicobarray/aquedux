// @flow

import actionTypes from '../constants/actionTypes'
import type { Store } from '../constants/types'
import { subscribe, unsubscribe } from '../channels'

export default (store: Store) => (next: Function) => (action: Object) => {
  const { type } = action

  if (type === actionTypes.client.AQUEDUX_CLIENT_CHANNEL_JOIN) {
    subscribe(store.getState(), action)
  } else if (type === actionTypes.client.AQUEDUX_CLIENT_CHANNEL_LEAVE) {
    unsubscribe(action)
  } else {
    next(action)
  }
}
