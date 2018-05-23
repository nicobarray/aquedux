// @flow

import channelManager from './channelManager'

type ChannelDef =
  | string
  | {
      name: string,
      reducer: (prevState: Object, action: Object) => Object
    }

export type AqueduxConfig = {
  hydratedActionTypes: Array<string>,
  endpoint: string,
  channels: Array<ChannelDef>
}

let config = {
  hydratedActionTypes: [],
  endpoint: '127.0.0.1',
  channels: []
}

function validateChannelDefinitions(def: ChannelDef) {
  const isDefault = typeof def === 'string'
  const isCustom = !isDefault && def.hasOwnProperty('name') && def.hasOwnProperty('reducer')

  if (!isDefault && !isCustom) {
    throw new Error('The custom channel definition must contain the `name` and `reducer` keys.')
  }
}

const setConfig = (newConfig: AqueduxConfig): AqueduxConfig => {
  config = Object.keys(newConfig).reduce((result: Object, key: string) => {
    if (!config.hasOwnProperty(key)) {
      return result
    }

    const merged: AqueduxConfig = {
      ...result,
      [key]: newConfig[key]
    }

    return merged
  }, config)

  config.channels.forEach(validateChannelDefinitions)
  config.channels.forEach(def => {
    const { name, reducer } = (() => {
      if (typeof def === 'string') {
        const name = def
        const reducer = (prevState, snapshot) => ({ ...prevState, [name]: snapshot })
        return { name, reducer }
      } else {
        return def
      }
    })()

    channelManager.define(name, reducer)
  })

  return config
}

const getConfig = (): AqueduxConfig => config

export default {
  getConfig,
  setConfig
}
