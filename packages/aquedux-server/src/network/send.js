// @flow

import jwt from 'jsonwebtoken'
import omit from 'lodash/omit'

import configManager from '../managers/configManager'

// This method is the ONLY one that can use sockjs write method.
// It removes the tankId AND strip the meta field from the action.
const send = (socket: any, action: Object) => {
  const { secret } = configManager.getConfig()
  // The water is an action ready to be sent on the socket.

  const meta = action.meta
    ? {
        ...omit(action.meta, ['private'])
      }
    : {}

  const water = {
    ...action,
    meta: undefined,
    tankId: undefined,
    origin: undefined,
    token: jwt.sign(meta, secret)
  }

  socket.write(JSON.stringify(water))
}

export default send
