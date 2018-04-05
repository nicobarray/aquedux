import omit from 'lodash/omit'

import { getOwnId } from '../network/server'

export const privateAnswer = (tankId, action) => {
  const ownId = getOwnId()
  const water = {
    ...omit(action, ['token', 'tankId']),
    origin: `${ownId}:${tankId}`,
    meta: {
      private: true
    }
  }

  return water
}
