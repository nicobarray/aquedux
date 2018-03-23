import omit from 'lodash/omit'
import jwt from 'jsonwebtoken'

import configManager from '../managers/configManager'

import logger from '../utils/logger'

const receive = (dispatch, tankId, action) => {
  const { secret } = configManager.getConfig()
  let meta = {}

  if (action.token) {
    try {
      meta = jwt.verify(action.token, secret)
    } catch (err) {
      logger.error({ what: 'jwt', who: 'receive', err })
    }
  }

  const water = {
    ...omit(action, ['token']),
    tankId,
    meta
  }

  logger.trace({
    who: 'receive',
    what: 'action road',
    where: "dispatch'd to local redux",
    step: 1,
    type: water.type
  })

  dispatch(water)
}

export default receive
