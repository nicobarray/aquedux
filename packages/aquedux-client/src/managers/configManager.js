// @flow

import logger from '../utils/logger'

let config = {
  pingAwareActionTypes: [],
  timeout: 5000,
  endpoint: '127.0.0.1'
}

export type AqueduxConfig = typeof config

const setConfig = (newConfig: any): AqueduxConfig => {
  config = Object.keys(newConfig).reduce((result, key) => {
    if (!config.hasOwnProperty(key)) {
      return result
    }
    const merged: AqueduxConfig = {
      ...result,
      [key]: newConfig[key]
    }
    return merged
  }, config)
  logger.trace({
    who: 'aqueduxClient::configManager',
    what: 'config has been set',
    config
  })
  return config
}

const getConfig = (): AqueduxConfig => config

export default {
  getConfig,
  setConfig
}
