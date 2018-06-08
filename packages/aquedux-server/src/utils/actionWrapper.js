// @flow

import omit from 'lodash/omit'

import configManager from '../managers/configManager'

export const privateAnswer = (tankId: string, action: Object): Object => {
  const { serverId } = configManager.getConfig()

  return {
    ...omit(action, ['token', 'tankId']),
    meta: {
      private: true,
      origin: `${serverId}:${tankId}`
    }
  }
}
