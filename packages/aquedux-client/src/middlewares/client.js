// @flow

import actionTypes from '../constants/actionTypes'
import * as eventHub from '../utils/eventHub'

export default (_store: any) => (next: Function) => (action: Object) => {
  const { type } = action

  if (type === actionTypes.AQUEDUX_CLIENT_START) {
    eventHub.raise(eventHub.AQUEDUX_CLIENT_START)
  } else if (type === actionTypes.AQUEDUX_CLIENT_STOP) {
    eventHub.raise(eventHub.AQUEDUX_CLIENT_STOP)
  } else if (type === actionTypes.AQUEDUX_CLIENT_RESTART) {
    eventHub.raise(eventHub.AQUEDUX_CLIENT_RESTART)
  }

  return next(action)
}
