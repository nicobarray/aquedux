import jwt from 'jsonwebtoken'
import omit from 'lodash/omit'

import logger from '../utils/logger'

// This method is the ONLY one that can use sockjs write method.
// It removes the tankId AND strip the meta field from the action.
const send = (tank, action) => {
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
    token: jwt.sign(meta, '<TODO: hook that to env>')
  }

  logger.trace({
    who: 'send',
    what: 'action road',
    where: 'send through SockJS',
    step: 8,
    type: action.type
  })
  tank.conn.write(JSON.stringify(water))
}

export default send
