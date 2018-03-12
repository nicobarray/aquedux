// @flow

import type { Action, ChannelsStateType, DefinitionStateType } from '../constants/types'

import actionTypes from '../constants/actionTypes'

export const initialState: ChannelsStateType = {
  definitions: {}
}

const reducer = (prevState: ChannelsStateType = initialState, action: Action): ChannelsStateType => {
  if (action.type === actionTypes.channel.AQUEDUX_CHANNEL_DEFINE) {
    if (!action.channelName || !action.channelPattern) {
      return prevState
    }
    const name = (action.channelName: string)
    const pattern = (action.channelPattern: string)

    return {
      ...prevState,
      definitions: {
        ...prevState.definitions,
        [name]: {
          name,
          pattern,
          template: false
        }
      }
    }
  }
  if (action.type === actionTypes.channel.AQUEDUX_CHANNEL_DEFINE_TEMPLATE) {
    if (!action.channelName) {
      return prevState
    }
    const name = (action.channelName: string)

    return {
      ...prevState,
      definitions: {
        ...prevState.definitions,
        [name]: {
          name,
          template: true
        }
      }
    }
  }
  return prevState
}

export default reducer

export const selectors = {
  listChannelNames: (state: ChannelsStateType): Array<string> => Object.keys(state.definitions),
  listAll: (state: ChannelsStateType): Array<DefinitionStateType> =>
    Object.keys(state.definitions).map(name => state.definitions[name]),
  listChannels: (state: ChannelsStateType): Array<DefinitionStateType> =>
    Object.keys(state.definitions)
      .map(name => state.definitions[name])
      .filter(def => !def.template),
  listTemplates: (state: ChannelsStateType): Array<DefinitionStateType> =>
    Object.keys(state.definitions)
      .map(name => state.definitions[name])
      .filter(def => def.template),
  isTemplate: (channelName: string, state: ChannelsStateType): boolean => state.definitions[channelName].template,
  getPattern: (channelName: string, state: ChannelsStateType): string => {
    const def = state.definitions[channelName]
    return def.pattern || def.name
  }
}
