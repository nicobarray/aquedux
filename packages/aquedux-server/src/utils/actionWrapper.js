// @flow

import omit from 'lodash/omit'

import configManager from '../managers/configManager'

export const privateAnswer = (tankId: string, action: Object): Object => {
  const { serverId } = configManager.getConfig()

  return {
    ...omit(action, ['token', 'tankId']),
    origin: `${serverId}:${tankId}`,
    meta: {
      private: true
    }
  }
}
