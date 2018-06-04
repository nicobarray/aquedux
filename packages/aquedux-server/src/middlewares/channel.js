// @flow

import actionTypes from '../constants/actionTypes'
import type { Store } from '../constants/types'
import { subscribeFromAction, unsubscribeFromAction } from '../network/subscribe'

export default (store: Store) => (next: Function) => (action: Object) => {
  const { type } = action

  if (type === actionTypes.client.AQUEDUX_CLIENT_CHANNEL_JOIN) {
    subscribeFromAction(store, action)
  } else if (type === actionTypes.client.AQUEDUX_CLIENT_CHANNEL_LEAVE) {
    unsubscribeFromAction(store, action)
    // } else if (type === actionTypes.api.AQUEDUX_REMOVE_QUEUE) {
    //   deleteQueueFromAction(store, action)
  } else {
    next(action)
  }
}
