// @flow

import channelManager from '../managers/channelManager'
import actionTypes from '../constants/actionTypes'
import { composeNameFromAction } from '../utils'

export default (_store: any) => (next: any) => (action: any) => {
  const { type } = action

  if (type === actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN) {
    // The action.name here is already composed.
    const { name, id } = action
    const template = !!id

    const sub = { name, id, template }

    if (!channelManager.hasSub(sub)) {
      channelManager.addSub(sub)
    }
  } else if (type === actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE) {
    const name = composeNameFromAction(action)
    channelManager.delSub(name)
  }

  return next(action)
}
