// @flow

import keygen from 'keygenerator'
import uuid from 'uuid'

import logger from '../utils/logger'
import channelManager from './channelManager'

// type ChannelDefinition = {
//   name: string,
//   pattern: ?string,
//   template: boolean
// }

let config = {
  queueLimit: 0,
  hydratedActionTypes: [],
  logLevel: process.env.AQUEDUX_LOG_LEVEL || 'info',
  routePrefix: '',
  /**
   * A new JWT secret is generated at each start, if missing.
   * User should override it with a contant one
   * if he needs to persist some JWT token uppon server restart
   * or client reconnection on a different server
   */
  secret: null,
  host: '0.0.0.0',
  port: 4242,
  channels: [],
  templates: [],
  redisHost: process.env.DB_PORT_6379_TCP_ADDR || '127.0.0.1', // Default redis env var
  redisPort: process.env.DB_PORT_6379_TCP_PORT || '6379', // Default redis env var

  doFragmentSnapshot: (prevState: any): any => prevState,

  onConnection: (_socket: any) => {},
  onClose: (_socket: any) => {},
  serverId: uuid.v4()
}

export type AqueduxConfig = typeof config

const configValidate = (config_: AqueduxConfig) => {
  if (config_.queueLimit > 0 && !config_.doFragmentSnapshot) {
    logger.fatalExit(1, {
      who: 'configManager',
      what: 'Invalid config: doFragmentSnapshot handler should be defined if queueLimit > 0'
    })
  }

  if (!config.secret) {
    logger.warn({
      who: 'configManager',
      what:
        "No JWT secret specified. A temporary one has been generated but clients won't be able to connect after a server restart or to another instance"
    })
    config.secret = keygen.password()
  }

  return config
}

const setConfig = (newConfig: any): AqueduxConfig => {
  config = Object.keys(newConfig).reduce((result, key) => {
    if (!config.hasOwnProperty(key)) {
      logger.warn({
        who: 'configManager',
        what: 'Unknown config key',
        key
      })

      return result
    }

    return {
      ...result,
      [key]: newConfig[key]
    }
  }, config)

  logger.level(config.logLevel)

  config = configValidate(config)

  config.channels.filter(channel => typeof channel === 'string').forEach(channelManager.addDefaultChannel)
  config.channels
    .filter(channel => typeof channel !== 'string')
    .filter(channelManager.isValidChannel)
    .forEach(channelManager.addChannel)
  config.templates.filter(channelManager.isValidTemplate).forEach(channelManager.addTemplate)

  logger.trace({
    who: 'configManager',
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
