// @flow

import keygen from 'keygenerator'

import logger from '../utils/logger'

let config = {
  queueLimit: 0,
  hydratedActionTypes: [],
  routePrefix: '',
  /**
   * A new JWT secret is generated at each start.
   * User should override it with a contant one
   * if he needs to persist some JWT token uppon server restart
   * or client reconnection on a different server
   */
  secret: keygen.password(),

  redisHost: process.env.DB_PORT_6379_TCP_ADDR || '127.0.0.1', // Default redis env var
  redisPort: process.env.DB_PORT_6379_TCP_PORT || '6379', // Default redis env var

  doFragmentSnapshot: (prevState: any): any => prevState,

  onConnection: (_socket: any) => {},
  onClose: (_socket: any) => {}
}

export type AqueduxConfig = typeof config

const configValidate = (config_: AqueduxConfig) => {
  if (config_.queueLimit > 0 && !config_.doFragmentSnapshot) {
    logger.fatalExit(1, {
      who: 'configManager',
      what: 'Invalid config: doFragmentSnapshot handler should be defined if queueLimit > 0'
    })
  }
}

const setConfig = (newConfig: any): AqueduxConfig => {
  config = Object.keys(newConfig).reduce((result, key) => {
    if (!config.hasOwnProperty(key)) {
      logger.warn({
        who: 'configManager',
        what: 'Unkown config key',
        key
      })
      return result
    }
    const merged: AqueduxConfig = {
      ...result,
      [key]: newConfig[key]
    }
    return merged
  }, config)
  logger.trace({
    who: 'configManager',
    what: 'config has been set',
    config
  })
  configValidate(config)
  return config
}

const getConfig = (): AqueduxConfig => config

export default {
  getConfig,
  setConfig
}
